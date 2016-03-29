/*
 * This file is part of Cilia.
 *
 * Copyright (C) 2016  Mikael Brockman
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// Proxy HTTP requests to Docker IPs.
//
// The first component of the vhost should match a
// container's COMMIT environment variable, in the
// form of a 40-hex hash.

var Proxy = require("http-proxy")
var Docker = require("docker-remote-api")()
var auth = require("basic-auth")

// Cached map from 40-hex commit hash to container IP.
// Since Docker container IPs are transient, this cache
// can get stale, so we try to update it often.
var vhosts = {}

var proxy = Proxy.createProxyServer()

proxy.on("error", function(err, req, res) {
  res.writeHead(500, {
    "Content-Type": "text-plain"
  })
  res.end("proxy error")
})

function browse() {
  return new Promise(function(resolve, reject) {
    Docker.get("/containers/json", { json: true }, function(err, containers) {
      if (err) {
        reject(err)
      }

      var vhostPromises = Promise.all(
        containers.filter(
          // Only use containers marked with our label.
          function(x) { return x.Labels["cilia.expose"] }

        ).map(function(container) {

          // Grab the `docker inspect` data and look up the IP.
          return new Promise(function(resolve, reject) {
            Docker.get(
              "/containers/" + container.Id + "/json", { json: true },
              function(err, container) {
                if (err) { reject(err) }
                var commit = getContainerCommit(container)
                getContainerIp(container).then(function(ip) {
                  resolve([commit, ip])
                }).catch(function(err) {
                  reject(err)
                })
              }
            )
          })
        })
      )

      vhostPromises.then(
        // Create a map of the vhost entries we found.
        function(results) {
          var map = {}
          results.forEach(function(x) { map[x[0]] = x[1] })
          resolve(map)
        },
        reject
      )
    })
  })
}

function getContainerCommit(container) {
  // Look for the commit hash in the container's environment.
  var env = container.Config.Env
  for (var i = 0; i < env.length; i++) {
    if (env[i].match(/^COMMIT=(.*)$/)) {
      return RegExp.$1
    }
  }
}

function getContainerIp(container) {
  // This is messy because for some reason the IP is not always
  // in the `docker inspect` data, and then we need to look in
  // the `docker network ls` data.  We try both because the first
  // is faster and we already have that data.  And we need the
  // inspect data to see the labels.

  var networks = container.NetworkSettings.Networks
  var ipFromInspect = networks[Object.keys(networks)[0]].IPAddress
  if (ipFromInspect) {
    return new Promise(function(resolve) {
      resolve(ipFromInspect)
    })

  } else {
    return new Promise(function(resolve, reject) {
      Docker.get("/networks", { json: true }, function(err, networks) {
        if (err) {
          reject(err)
        } else {
          for (var i = 0; i < networks.length; i++) {
            var network = networks[i]
            var match = network.Containers[container.Id]
            if (match && match.IPv4Address) {
              // Strip the subnet specifier e.g. /16.
              var ip = match.IPv4Address.replace(/\/\d+$/, "")
              resolve(ip)
              return
            }
          }
          resolve(null)
        }
      })
    })
  }
}

function getIpForCommit(commit) {
  return new Promise(function(resolve, reject) {
    if (vhosts[commit]) {
      // Cache hit.
      resolve(vhosts[commit])
    } else {
      // Cache miss; refresh and look again.
      refresh().then(function() {
        if (vhosts[commit]) {
          // Found it!
          resolve(vhosts[commit])
        } else {
          // Nope, that commit isn't running.
          reject(new Error("no container for " + commit))
        }
      }, function(err) {
        reject(err)
      })
    }
  })
}

// Plain Node HTTP server handler.
// Proxies requests to containers.
function handle(req, res) {
  var user = auth(req)

  var host = req.headers.host
  var url = req.url

  if (host && host.match(/^([a-z0-9]{40})\..*/)) {
    proxyToContainer(req, res, RegExp.$1)
  } else if (host && host.match(/^cilia\..*/)) {
    if (!user
        || user.pass !== process.env["CILIA_WEB_PASSWORD"]
        || user.name !== process.env["CILIA_WEB_USERNAME"]
       ) {
      res.statusCode = 401
      res.setHeader("WWW-Authenticate", 'Basic realm="cilia"')
      res.end("Authentication needed")
    } else if (url.startsWith("/api/")) {
      proxyToApi(req, res)
    } else {
      proxyToWebpack(req, res)
    }
  } else {
    res.statusCode = 404
    res.end("Nope")
  }
}

function proxyToContainer(req, res, commit) {
  getIpForCommit(commit).then(function(ip) {
    proxy.web(req, res, { target: "http://" + ip })
  }, function(err) {
    console.error(err)
    res.statusCode = 404
    res.end("Nope")
  })
}

function proxyToWebpack(req, res) {
  proxy.web(req, res, { target: "http://webpack" })
}

function proxyToApi(req, res) {
  proxy.web(req, res, { target: "http://api" })
}

function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms)
  })
}

function refreshContinuously(ms) {
  refresh().then(function() {
    return sleep(ms).then(function() {
      refreshContinuously(ms)
    })
  })
}

function refresh() {
  return browse().then(function(result) {
    reportChanges(vhosts, result)
    vhosts = result
    return vhosts
  })
}

function reportChanges(before, after) {
  var keyUnion = {}
  Object.keys(before).forEach(function(x) { keyUnion[x] = true })
  Object.keys(after).forEach(function(x) { keyUnion[x] = true })
  Object.keys(keyUnion).forEach(function(key) {
    if (before[key] && after[key]) {
      if (before[key] != after[key]) {
        console.log("changed", key, before[key], after[key])
      }
    } else if (before[key]) {
      console.log("removed", key, before[key])
    } else if (after[key]) {
      console.log("added", key, after[key])
    }
  })
}

refreshContinuously(1000)
require("http").createServer(handle).listen(80)
