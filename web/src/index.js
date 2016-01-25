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
let ansi = require("ansi_up")

let state = {
  time: (new Date).toISOString(),
  requests: [],
  route: { index: true },
  projects: { },
  taskDetails: { },
  pings: { },
  browserstackSessions: { },
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
  },
 post: (url, body, type) => {
    let request = { method: "POST", url: url }
    change({ ...state, requests: [...state.requests, request] })
    return fetch(url, {
      method: "POST",
      body: body,
      headers: {
        "Content-Type": type || "text/plain",
      },
    }).then(x => {
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
        <div style={{ opacity: 0.3 }}>
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
          <CommitDetails
            { ...{ time, project, commit, simple: true } } />
          <CommitStatusIndicator {... { project, commit } } />
        </WideNavBar>
        <iframe style={styles.iframe} src={`http://${host}`} />
      </div>
    )
  }
}

class TaskPill extends React.Component {
  constructor(props) {
    super(props)
    this.state = { open: false }
  }

  color() {
    return {
      started: "cornflowerblue",
      cancelling: "cyan",
      cancelled: "darkcyan",        
      succeeded: "#25d25a",
      failed: "salmon",
      waiting: "lightgrey",
    }[this.getStatus()]
  }

  getStatus() { return this.getTask().status || "waiting" }
  getTask() { return this.props.commit.tasks[this.props.taskName] }

  render() {
    let style = {
      ...styles.pill,
      ...{ backgroundColor: this.color(), color: "white" },
    }
    
    return (
      <div style={{ position: "relative", display: "inline-flex" }}
            onMouseEnter={() => this.setState({ open: true }) }
            onMouseLeave={() => this.setState({ open: false }) }>
        <div style={style}>
          {this.props.taskName}
        </div>
        {(this.state.open || this.props.horizontal) && this.renderMenu()}
      </div>
    )
  }

  renderMenu() {
    let status = this.getStatus()

    let options = []
    let props = this.props
    if (this.props.text == "up" && status == "started")
      options.push(<PillOption {...props} action="visit" />)
    if (status == "succeeded" || status == "failed")
      options.push(<PillOption {...props} action="start" />)
    if (status == "cancelled" || status == "waiting")
      options.push(<PillOption {...props} action="start" />)
    if (status == "started")
      options.push(<PillOption {...props} action="stop" />)

    let style = {
      ...styles.dropdown.container,
      ...(this.props.horizontal ? {
            position: "relative",
            display: "flex",
            flexDirection: "row",
          } : {})
    }

    return (
      <div style={style}>
        <div style={{
          textTransform: "uppercase",
          backgroundColor: this.color(),
          color: "white",
          padding: "0 .5rem",
          minWidth: "6rem"
        }}>{status}</div>
        <div style={{
          display: "flex",
          flexDirection: this.props.horizontal ? "row" : "column",
          border: "1px solid #eee",
          borderTopWidth: 0,
        }}>
          {options}
        </div>
      </div>
    )
  }
}

class PillOption extends React.Component {
  constructor(props) {
    super(props)
    this.onClick = this.onClick.bind(this)
  }

  onClick() {
    let project = this.props.project.name
    let hash = this.props.commit.sha
    let task = this.props.taskName
    api.post(
      `/api/projects/${project}/commits/${hash}/tasks/${task}/request`,
      this.props.action
    ).catch(e => alert(e.toString()))
  }

  render() {
    return (
      <div style={{ margin: "0 0.5rem", cursor: "pointer" }} onClick={this.onClick}>
        {this.props.action}
      </div>
    )
  }
}

class CommitStatusIndicator extends React.Component {
  render() {
    let { commit, project } = this.props
    let tasks = Object.keys(commit.tasks).map(x =>
      <TaskPill key={x} taskName={x}
        commit={commit} project={project} />
    )
    return (
      <span style={{ textAlign: "right" }}>
        {tasks}
      </span>
    )
  }
}

class Sha extends React.Component {
  render() {
    let { project, commit } = this.props
    let short = commit.sha.substr(0, 8)
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
    let date =
      <span style={styles.project.commit.date}>
        {moment(commit.date).calendar(time)}
      </span>
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <span style={styles.project.commit.details}>
          { sha }
          <span style={styles.project.commit.name}>
            {commit.author.email.replace(/@.*/, "")}
          </span>
          { !simple && date }
          { simple && message }
          { !simple && <CommitStatusIndicator { ...{ commit, project } } /> }
        </span>
        { !simple && <div>{message}</div> }
      </div>
    )
  }
}

let plural = (count, noun) =>
  `${count} ${noun}${count == 1 ? "" : "s"}`

let values = x => Object.keys(x).map(k => x[k])

let countProjects = () => values(state.projects).length
let countRunningTasks = () => {
  let n = 0
  values(state.projects).forEach(project => {
    project.commits.forEach(commit => {
      values(commit.tasks).forEach(task => {
        if (task.status == "started")
          n++
      })
    })
  })
  return n
}

let sortCommits = commits =>
  [].concat(commits).sort((a, b) => +(moment(b.date)) - +(moment(a.date)))

class IndexRoute extends React.Component {
  render() {
    let text =
      `${plural(countProjects(), "project")}.
       ${plural(countRunningTasks(), "running task")}.`

    if (countProjects() == 0)
      return <Loading {...this.props} />

    return (
      <div style={styles.root}>
        <NavBar>
          <span style={{ opacity: 0.8 }}>
            {text}
          </span>
        </NavBar>
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
          {sortCommits(project.commits).map(
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

let requestTaskDetails = ({ project, hash }) =>
  api.get(`/api/projects/${project}/commits/${hash}`).then(
    details => change({
      ...state,
      taskDetails: {
        ...state.taskDetails,
        [hash]: details
      }
    })
  )

let requestBrowserstackSession = id =>
  api.get(`/api/browserstack/sessions/${id}`).then(
    session => change({
      ...state,
      browserstackSessions: {
        ...state.browserstackSessions,
        [id]: session
      }
    })
  )

let requestBrowserstackSessions = ({ project, hash }) => {
  project = getProject(project)
  if (!project) return
  let commit = getCommit(project, hash)
  Object.keys(commit.tasks).forEach(taskName => {
    if (state.taskDetails[commit.sha]) {
      let log = state.taskDetails[commit.sha][taskName].log
      if (log.match(/browserstack session: (\w+)/i)) {
        requestBrowserstackSession(RegExp.$1)
      }
    }
  })
}

setInterval(() => {
  initialize()
  if (state.route.commit) {
    requestTaskDetails(state.route.commit)
    requestBrowserstackSessions(state.route.commit)
  }
}, 2000)

class CommitRoute extends React.Component {
  componentWillMount() {
    if (!this.getTaskDetails())
      requestTaskDetails(this.props.route.commit)
  }

  getTaskDetails() {
    return this.props.taskDetails[this.props.route.commit.hash]
  }

  render() {
    let { project, hash } = this.props.route.commit

    let taskDetails = this.getTaskDetails()
    if (!taskDetails) return <Loading {...this.props} />
      
    project = getProject(project)
    if (!project) return <Loading {...this.props} />
    
    let commit = getCommit(project, hash)
    return (
      <div style={styles.root}>
        <NavBar>
          <CommitDetails {... { project, commit, simple: true } } />
        </NavBar>
        <div style={styles.main}>
          <div style={{ marginTop: ".5rem" }}>
            <a href={`#/instance/${project.name}/${hash}`}>
              Visit this commit
            </a>
          </div>
          { this.renderTasks({ project, commit, taskDetails }) }
        </div>
      </div>
    )
  }

  renderTasks({ project, commit, taskDetails }) {
    return Object.keys(commit.tasks).map(taskName =>
      <TaskDetails {...{
        key: taskName,
        project, commit, taskName,
        details: taskDetails[taskName],
        browserstackSessions: this.props.browserstackSessions,
      }} />
    )
  }
}

class TaskLog extends React.Component {
  componentDidMount() {
    this.refs.node.scrollTop = this.refs.node.scrollHeight
  }

  render() {
    return (
      <div style={{
             whiteSpace: "pre-wrap",
             padding: ".5rem 1rem",
             maxHeight: "24ex",
             overflow: "scroll",
             background: "#555",
             color: "ivory",
           }}
        ref="node"
        dangerouslySetInnerHTML={{
          __html: ansi.ansi_to_html(this.props.log)
        }}>
      </div>
    )
  }
}

class TaskDetails extends React.Component {
  render() {
    let { project, commit, taskName, details } = this.props
    return (
      <div style={{ margin: "0.5rem 0 0 0" }}>
        <TaskPill taskName={taskName} horizontal={true}
                  project={project} commit={commit} />
        { details.log && <TaskLog log={details.log} /> }
        { details.log &&
          <Browserstack log={details.log}
            browserstackSessions={this.props.browserstackSessions} />
        }
      </div>
    )
  }
}

class Browserstack extends React.Component {
  parse() {
    if (this.props.log.match(/browserstack session: (\w+)/i)) {
      return RegExp.$1
    } else {
      return null
    }
  }

  getSession() {
    let result = this.parse()
    if (result)
      return this.props.browserstackSessions[result]
  }

  render() {
    let session = this.getSession()
    if (session && session.automation_session.video_url) {
      return (
        <div style={{ margin: "1rem 0" }}>
          <video controls width="100%"
            src={session.automation_session.video_url}/>
        </div>
      )
    } else {
      return null
    }
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
