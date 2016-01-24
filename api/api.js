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

let connect = require("connect")
let fs = require("fs")
let git = require("nodegit")

const ROOT = "/cilia"

let app = connect()

app.use((req, res) => {
  if (req.url == "/api/") {
    res.end("cilia api")
  } else if (req.url == "/api/projects") {
    inspectProjects()
      .then(sendJSON(res))
      .catch(e => {
        res.statusCode = 500
        res.end()
      })
  } else {
    res.statusCode = 404
  }
})

let sendJSON = res => json => {
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(json))
}

let inspectProjects = () => new Promise((resolve, reject) => {
  let names = fs.readdirSync(`${ROOT}/projects`)
  let projects = {}
  Promise.all(
    names.map(name => {
      return inspectProject(name).then(x => projects[name] = x)
    })
  ).then(() => resolve(projects), reject)
})

let inspectProject = name => new Promise((resolve, reject) => {
  let project = {
    name: name,
    commits: []
  }
  let projectRoot = `${ROOT}/projects/${name}`
  let clone = `${projectRoot}/clone`

  if (fs.statSync(clone).isDirectory()) {
    git.Repository.open(clone).then(repo => {
      if (fs.statSync(`${projectRoot}/commits`).isDirectory()) {
        let hashes = fs.readdirSync(`${projectRoot}/commits`)
        return inspectCommits({ repo, projectRoot, hashes })
          .then(commits => {
            project.commits = commits
          })
      } else {
        resolve(project)
      }
    }).then(
      () => resolve(project),
      reject
    )
  } else {
    resolve(project)
  }
})

let inspectCommits = ({
  repo, projectRoot, hashes
}) => Promise.all(hashes.map(hash => {
  return repo.getCommit(hash).then(commit => {
    return {
      sha: hash,
      author: {
        name: commit.author().name(),
        email: commit.author().email(),
      },
      date: commit.date(),
      message: commit.message(),
      run: inspectRun({ projectRoot, hash })
    }
  })
}))

let readFile = path => {
  try {
    return fs.readFileSync(path).toString().trim()
  } catch (e) {
    return null
  }
}

let inspectRun = ({ projectRoot, hash }) => {
  if (fs.statSync(`${projectRoot}/runs/${hash}`).isDirectory()) {
    let run = `${projectRoot}/runs/${hash}`
    return {
      pid: readFile(`${run}/pid`),
      status: readFile(`${run}/status`),
      started: readFile(`${run}/started`),
      finished: readFile(`${run}/finished`),
    }
  } else {
    return null
  }
}

require("http").createServer(app).listen(80)
