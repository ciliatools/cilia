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

require("./index.css")
let styles = require("./styles")

let React = require("react")
let DOM = require("react-dom")
let moment = require("moment")

let state = {
  time: (new Date).toISOString(),
  requests: [],
  route: { index: true },
  projects: {
  }
}

window.state = state

let change = newState => {
  state = newState
  render()
}

let route = (regexp, f) => {
  regexp = new RegExp(regexp)
  return (hash => {
    if (hash.match(regexp))
      return f()
  })
}

let changeRoute = (...routes) => {
  let result
  for (var i = 0; i < routes.length; i++)
    if (result = routes[i](location.hash))
      break
  change({
    ...state,
    route: result || { index: true }
  })
}

onhashchange = () => {
  changeRoute(
    route("^#/instance/([^/]+)/([a-z0-9]{40})$", () => ({
      instance: {
        project: RegExp.$1,
        commit: RegExp.$2,
      }
    })),
    route("^#/projects/([^/]+)/([a-z0-9]{40})$", () => ({
      commit: {
        project: RegExp.$1,
        hash: RegExp.$2,
      }
    }))
  )
}

let remove = (x, xs) => xs.filter(y => x != y)

let api = {
  get: url => {
    let request = { method: "GET", url: url }
    change({ ...state, requests: [...state.requests, request] })
    return fetch(url).then(x => x.json()).then(x => {
      change({ ...state, requests: remove(request, state.requests) })
      return x
    })
  }
}

let getCommit = (project, hash) =>
  project.commits.filter(x => x.sha == hash)[0]

let getProject = name => state.projects[name]

class WideNavBar extends React.Component {
  render() {
    return (
      <div style={styles.nav.bar.wide }>
        <h1 style={styles.nav.h1}>
          <a href="#/" style={{ textDecoration: "none" }}>
            Cilia
          </a>
        </h1>
        { this.props.children }
      </div>
    )
  }
}

class NavBar extends React.Component {
  render() {
    return (
      <div style={styles.nav.bar.narrow}>
        <h1 style={styles.nav.h1}>
          <a href="#/" style={{ textDecoration: "none" }}>
            Cilia
          </a>
        </h1>
        { this.props.children }
      </div>
    )
  }
}

class Loading extends React.Component {
  render() {
    return (
      <div style={styles.loading}>
        <div>Loading...</div>
        <br/>
        <div style={{ opacity: 0.5 }}>
          {this.props.requests.map((x, i) =>
            <div key={i}>{x.method} {x.url}</div>)}
        </div>
      </div>
    )
  }
}

class InstanceRoute extends React.Component {
  render() {
    let { route, time } = this.props
    let hash = route.instance.commit
    let project = getProject(route.instance.project)
    if (!project) return <Loading {...this.props } />
    
    let commit = getCommit(project, hash)
    let host = location.host.replace(/^cilia\./, `${hash}.`)
    return (
      <div style={styles.wideRoot}>
        <WideNavBar>
          <b style={styles.project.title}>{project.name}</b>
          <span style={styles.project.commit.sha}>
            { hash.substr(0, 10) }
          </span>
          <CommitDetails
            { ...{ time, project, commit, simple: true } } />
        </WideNavBar>
        <iframe style={styles.iframe} src={`http://${host}`} />
      </div>
    )
  }
}

class CommitStatusIndicator extends React.Component {
  render() {
    let { commit, project } = this.props
    let status = commit.run ? commit.run.status : "waiting"
    let element
    if (commit.run && commit.run.status == "running") {
      element =
        <a href={`#/instance/${project.name}/${commit.sha}`}
           style={{ textDecoration: "none" }}>
          running
        </a>
    } else {
      element =
        <span>{status}</span>
    }

    let colors = {
      running: "skyblue",
      cancelled: "darkcyan",
      succeeded: "darkgreen",
      failed: "salmon",
      waiting: "lightgrey",
    }

    let style = {
      ...styles.project.commit.status,
      ...({ backgroundColor: colors[status] })
    }

    return (
      <span style={style}>
        {element}
      </span>
    )
  }
}

class Sha extends React.Component {
  render() {
    let { project, commit } = this.props
    let short = commit.sha.substr(0, 10)
    return (
      <a href={`#/projects/${project.name}/${commit.sha}`}>
        {short}
      </a>
    )
  }
}

class CommitDetails extends React.Component {
  render() {
    let { time, project, commit, simple } = this.props
    let sha =
      <span style={styles.project.commit.sha}>
        <Sha {... { project, commit } } />
      </span>
    let message =
      <span style={styles.project.commit.message}>
        {commit.message}
      </span>
    return (
      <span style={styles.project.commit.details}>
        { sha }
        { !simple && <CommitStatusIndicator { ...{ commit, project } } /> }
        <span style={styles.project.commit.name}>
          {commit.author.name}
        </span>
        <span style={styles.project.commit.date}>
          {moment(commit.date).from(time)}
        </span>
        { !simple && message }
      </span>
    )
  }
}

class IndexRoute extends React.Component {
  render() {
    return (
      <div style={styles.root}>
        <NavBar/>
        <div style={styles.main}>
          {this.renderProjectList()}
        </div>
      </div>
    )
  }

  renderProjectList() {
    return (
      <div>
        {Object.keys(this.props.projects).map(
          (x, i) => this.renderProjectListItem(x, i))}
      </div>
    )
  }

  renderProjectListItem(item, i) {
    let project = this.props.projects[item]
    return (
      <div key={i} style={styles.project.container}>
        <div style={styles.project.title}>
          {item}
        </div>
        <div>
          {project.commits.map(
            (x, i) => this.renderCommit(project, x, i))}
        </div>
      </div>
    )
  }

  renderCommit(project, commit, i) {
    return (
      <div key={i} style={styles.project.commit.container}>
        <CommitDetails {... { project, commit, simple: false } } />
      </div>
    )
  }
}

class CommitRoute extends React.Component {
  render() {
    let { project, hash } = this.props.route.commit
    project = getProject(project)
    if (!project) return <Loading {...this.props} />
    let commit = getCommit(project, hash)
    return (
      <div style={styles.root}>
        <NavBar>
          <span style={styles.project.title}>
            { project.name }
          </span>
          <CommitDetails {... { project, commit, simple: true } } />
          <CommitStatusIndicator {... { project, commit } } />
        </NavBar>
        <div style={styles.main}>
          <div>PID: {commit.run.pid}</div>
          <div>Started: {commit.run.started}</div>
        </div>
      </div>
    )
  }
}

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = { firstFrame: true }
  }
  
  componentDidMount() {
    // Fade-in animation
    setTimeout(() => this.setState({ firstFrame: false }), 0)
  }
  
  render() {
    let view
    let { route } = this.props

    if (route.instance)
      view = <InstanceRoute { ...this.props } />
    else if (route.commit)
      view = <CommitRoute { ...this.props } />
    else
      view = <IndexRoute { ...this.props } />

    let style = {
      ...styles.container,
      opacity: this.state.firstFrame ? 0 : 1
    }
    
    return (
      <div style={style}>
        {view}
      </div>
    )
  }
}

let render = () =>
  DOM.render(<App {...state} />, document.querySelector("#root"))

document.documentElement.innerHTML += "<div id=root></div>"

render()

let initialize = () => {
  api.get(`/api/projects`).then(
    projects => change({ ...state, projects })
  )
}

initialize()
onhashchange()

setInterval(
  () => change({ ...state, time: (new Date).toISOString() }),
  1000
)