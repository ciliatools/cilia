# Cilia

Cilia combines *staging* and *testing* for **continuous integration
and QA** of web applications.  It's supposed to be simple, robust, and
fast.

The system makes some assumptions:

  - your project is in Git;
  - you can set up a DNS wildcard entry to the Cilia server;
  - your project can run in Docker Compose with private networking; and
  - your project can run behind a virtual host proxy.

## System configuration

You need to set up DNS. Let's say your domain is `example.com`. Then both

- `cilia.example.com` (the web frontend to Cilia) and
- `*.cilia.example.com` (proxying to running apps based on commit hash)

should point to the Cilia server.

You also need to set some environment variables:

- `CILIA_ROOT` should be a directory containing your project configuration,
  where Cilia can also store its work data;
- `CILIA_PATH` should point to the installation of Cilia itself; and
- `CILIA_HOSTNAME` should be (for example) `cilia.example.com`.

To use the Browserstack.com integration, set `BROWSERSTACK_USER` and `BROWSERSTACK_KEY`.

## Project configuration

Cilia's project configuration is a file structure at `$CILIA_ROOT/projects`.

Here is an example of configuring the `pet-store` project.

    $ mkdir -p $CILIA_ROOT/projects/pet-store/branches
    
We want to test the `master` and `experimental` branches.

    $ touch $CILIA_ROOT/projects/pet-store/branches/{master,experimental}

We set the Git origin from which Cilia will clone and pull:

    $ cat > $CILIA_ROOT/projects/pet-store/origin
    git@github.com:petstore/app

We only care about commits that modify the `server` or `client`
directories. (Optional.)

    $ cat > $CILIA_ROOT/projects/pet-store/commit-filter
    server
    client

## Repository configuration

There should also be a `.cilia` directory in the root of your project
repository.

    $ mkdir .cilia
    $ cd .cilia

Use the root Compose file.

    $ ln -s ../docker-compose.yml docker-compose.yml

Start building automatically when a commit is initialized.    

    $ echo build > on-commit
    
Create four named tasks. (Right now, these names are special, but that's a hack.)
    
    $ mkdir -p tasks/{build,up,wait,test}
    
Configure the number of concurrent tasks per type:
    
    $ echo 2 > tasks/build/concurrency # builds are heavy
    $ echo 15 > tasks/up/concurrency   # but run plenty of instances
    
Configure the way tasks lead to one another:

    $ echo up > tasks/build/on-succeeded
    $ echo wait > tasks/up/on-started
    $ echo test > tasks/wait/on-succeeded
    
Configure which Compose target to run:

    $ echo server > tasks/up/service

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
                4. Start task according to commit hook
    2. Otherwise:
        1. Clone the repository from the origin.
2. Wait a few seconds.
3. Repeat.

### Commit Task Watcher

1. For all commits:
    1. If the commit has a task request:
        1. Perform the task request.
        2. Run the relevant hook, if present.
        3. Save the task process ID.
        4. Await the task process.
        5. Clear the task process ID.
        6. Mark the task as finished/cancelled.
2. Wait a few seconds.
3. Repeat.

### Commit Task Reaper

1. For all commits:
    1. For all tasks:
        1. If the task seems dead:
            1. Reset its status.
2. Wait a few seconds.
3. Repeat.
