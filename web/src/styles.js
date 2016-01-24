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

module.exports = {
  container: {
    transition: "0.3s ease-in all",
  },
  loading: {
    position: "absolute",
    top: 0, right: 0, left: 0, bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  root: {
    position: "absolute",
    top: 0, right: 0, left: 0, bottom: 0,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    maxWidth: "50rem",
    margin: "0 auto",
  },
  wideRoot: {
    position: "absolute",
    top: 0, right: 0, left: 0, bottom: 0,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  nav: {
    bar: {
      narrow: {
        display: "flex",
        flexShrink: 0,
        padding: "0.3rem 0.4rem",
        background: "white",
        zIndex: 1,
        border: "1px solid #bbb",
        borderTop: "none",
        borderRadius: "0 0 .25rem .25rem",
      },
      wide: {
        display: "flex",
        flexShrink: 0,
        padding: "0.3rem 0.4rem",
        background: "white",
        zIndex: 1,
        borderBottom: "1px solid #bbb",
      }
    },
    h1: {
      display: "inline-block",
      font: "inherit",
      fontWeight: "bold",
      borderRadius: ".25rem",
      margin: "0 1rem 0 0",
      padding: "0 0.5rem",
      opacity: "0.7",
      backgroundColor: "#bbb",
      color: "white",
      textTransform: "upper-case",
    },
  },
  main: {
    overflow: "scroll",
    height: "100%",
  },
  iframe: {
    height: "100%",
    border: "none",
  },
  project: {
    container: {
      marginTop: ".5rem",
      marginLeft: ".5rem",
    },
    title: {
      fontWeight: "bold",
      textTransform: "uppercase",
      marginRight: "1rem",
    },
    commit: {
      container: {
        display: "flex",
        // background: "white",
        padding: ".25rem 1rem .5rem .5rem",
        // borderRadius: ".25rem",
        // border: "1px solid rgba(0, 0, 0, 0.2)",
      },
      sha: {
        marginRight: "1rem",
      },
      status: {
        textTransform: "uppercase",
        borderRadius: ".25rem",
        padding: "0 .5rem",
        background: "skyblue",
        color: "white",
        float: "right",
      },
      details: {
        flex: 1,
      },
      name: {
        marginRight: "1rem",
      },
      date: {
        marginRight: "1rem",
      },
      message: {
        display: "block",
        fontStyle: "italic",
        marginRight: "1rem",
        paddingLeft: "1rem",
      }
    }
  },
  commit: {
    container: {
      padding: ".5rem 1rem"
    }
  }
}
