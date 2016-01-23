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

var nodes = document.querySelectorAll("run")
for (var i = 0; i < nodes.length; i++) {
  (function() {
    var node = nodes[i]
    nodes[i].onclick = function(e) {
      location.hash = "run-" + node.dataset.hash
    }
  })()
}

onhashchange = function() {
  document.querySelector("main").scrollTop = 0
  if (location.hash == "#") {
    document.documentElement.removeAttribute("data-hash")
  } else {
    document.documentElement.dataset.hash = location.hash
  }
}
onhashchange()

function refresh() {
  var selectorThatPreventsRefresh = "run:target:not([data-status=running])"
  if (!document.querySelector(selectorThatPreventsRefresh)) {
    location.reload()
  }
}

var watcher
watch = function() {
  watcher = setInterval(refresh, 2000)
  localStorage.setItem("watching", "true")
}

unwatch = function() {
  clearInterval(watcher)
  watcher = null
  localStorage.removeItem("watching")
}

watchbutton.onclick = function() {
  if (watcher) {
    unwatch()
    watchbutton.innerHTML = "Watch"
    watchbutton.classList.remove("on")
  } else {
    watch()
    watchbutton.innerHTML = "Pause"
    watchbutton.classList.add("on")
  }
}

if (localStorage.getItem("watching")) {
  watchbutton.onclick()
  setTimeout(function() {
    var log = document.querySelector("run[data-status=running] log")
    if (log) {
      log.scrollTop = 99999
    }
    document.querySelector("main").scrollTop = 0
  }, 0)
}
