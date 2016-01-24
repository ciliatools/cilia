# Cilia

Cilia combines *staging* and *testing* for **continuous integration
and QA** of web applications.  It's supposed to be simple, robust, and
fast.  Uses include

  - building, tagging, and pushing Docker images;
  - running team-accessible staging servers;
  - running test suites;
  - and generally doing stuff with the latest repository commits.

The system makes some assumptions:

  - your project is in Git;
  - your project provides the scripts;
  - your project can run in Docker Compose with private networking; and
  - your project can run behind a virtual host proxy.

When you add a project to Cilia, it begins to work on the latest
commits starting at the heads of your chosen branches.  For every
commit, it triggers a Compose build operation, and then it starts
containers for the resulting images.  You configure how many commit
instances to run in parallel; the default is two.

Once Cilia has started a commit instance, it is published using a
virtual host proxy that matches subdomains against commit hashes.  For
example `af1234b12.staging.example.com` would proxy to a commit, given
that Cilia is running an instance for that commit.  The proxy also
understands branch references, so that
`some-branch.staging.example.com` goes to the most recent commit
instance for `some-branch`.

At this point you can see the commit instance described in the web
interface, and click a link to visit the application built from the
relevant commit.  You can also manually trigger integration test runs,
Docker Registry operations like tagging and pushing, and custom
commands defined in the repository configuration.

Of course, you can configure the project to run such steps
automatically.

More detailed instructions are coming.

## Processes

This is not entirely accurate but it's pretty much what happens.
These are implemented as shell scripts for relative easy control of
files, processes, pipes, errors, and so on.

### Repository Watcher

1. For all repositories:
    1. If there is a clone directory:
        1. Run `git pull` in the clone directory.
        2. For the most recent commits:
            1. If the commit is unknown:
                1. Create the commit directory.
                2. Create the commit work tree.
                3. Initialize the task work tree.
    2. Otherwise:
        1. Clone the repository from the origin.
2. Wait a few seconds.
3. Repeat.

### Commit Task Watcher

1. For all commits:
    1. If the commit has a task request:
        1. Perform the task request.
2. Wait a few seconds.
3. Repeat.

### Commit Task Reaper

1. For all commits:
    1. For all tasks:
        1. If the task seems dead:
            1. Reset its status.
2. Wait a few seconds.
3. Repeat.