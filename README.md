<p align="center">
  <img alt="portaler" src="https://portaler.zone/portaler-github.png" />
</p>

<p align="center">
  An Albion Online Avalonion Roads shared mapping tool
</p>

<p align="center">
  <a href="https://discord.gg/QAjhJ4YNsD">
    <img alt="discord" src="https://portaler.zone/discord.png" />
  </a>
</p>

---

<br />

![Netlify Status](https://api.netlify.com/api/v1/badges/76c8bf82-cf50-4310-8121-8196249f49bc/deploy-status)
![Portaler-Core](https://circleci.com/gh/Portaler-Zone/portaler-core.svg?style=shield)

**Contents**

- [What it is](#what-it-is)
- [About the codebase](#about-the-codebase)
- [Running](#running)
  - [Running Locally](./local)
- [Supporting](#supporting)
- [Development](#development)

<br />

# What it is

Portaler is a mapping tool for Avalonian Roads in Albion Online. It is fully Albion TOS compliant, because every user action is completely manual and nothing is automatically pulled or scraped from the Albion client or network packets. This tool simply provides a clean way for guilds/alliances share roads mapping internally.

The data we use to populate information is collected mostly from [Albion Data Project](https://www.albion-online-data.com/) as well as other manual crowd sourced methods.

<p align="center">
  <img src="https://portaler.zone/screenshot.png" width="600px" alt="screenshot" />
</p>

Portaler can either be self hosted or we can provide hosting for your group through **in game currency**. We are not allowed to take real money for our services, but if you would like to support the project monetarily out of the kindness of your heart, please see the [Supporting](#supporting) section at the bottom.

---

### Monorepo

This is a monorepo utilizing [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/workspaces/). Individual applications can be found in the [packages](/packages) folder.

## About the codebase

We have split up the project into 2 main workspaces. Main Packages and Shared.

### Main Packages

Contained under packages/\* folder

- [api-server](/packages/api-server)
  - The main API server
- [discord-bot](/packages/discord-bot)
  - The discord bot that allows roles to be assigned to users
  - Also contains the database migration files
- [fontend](/packages/frontend)
  - The React frontend

### Locally shared libraries

Contained under the shared/\* folder

- [data-models](/shared/data-models)
  - A collection of commonly shared data functions and models for the database & redis
- [types](/shared/types)
  - Just simply typescript type definitions shared across the different packages
- [universal-utils](/shared/universal-utils)
  - A collection of common utilities that can be used in either the frontend or node servers

---

## Running

**If you just want to run for yourself locally, please see the instructions [here](./local).**

---

If you would like to run the project on your own server, we provide Dockerhub images and you can find a docker-compose.yml file in the [docker](/docker) folder. If you would like to just run the project, you do not need to build the dockerfiles contained in the docker folder, just simply update the `.env.example` file with your variables, the variables in the docker-compose.yml and run:

    docker-compose up -d

Links to our dockerhub images:

- [api-server](https://hub.docker.com/repository/docker/mawburn/portaler)
- [discord-bot](https://hub.docker.com/repository/docker/mawburn/portaler-bot)

You will also need to create an application and a Discord developer account. You can find that [here](https://discord.com/developers/docs/intro).

If you need help setting up docker, [check out the instructions for running locally](./local) just use the docker compose contained in the [docker](/docker) folder instead.

---

## Supporting

If you'd like to support the project, we would much rather you give your support to the [Albion Data Project](https://www.albion-online-data.com/). This is the backbone of where we get our information, as well as virtually all other Albion fan based projects get their data.

[<img width="200px" height="auto" src="https://i.imgur.com/ly3lalz.png" />](https://www.patreon.com/bePatron?u=10422119)

---

However, if you'd really like to just buy us a coffee to throw a few bucks at server costs, feel free to use the Ko-Fi link below. You will receive no perks for this, other than our gratitude.

[![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Q5Q42OP4V)

---

## Development

This project requires that you have yarn installed.

[Yarn installation instructions](https://classic.yarnpkg.com/en/docs/install/)

### Overview of root scripts

Be sure to check out the scripts we have provided in the root [package.json](./package.json) file, that will make your life easier.

There are a number of scripts that can be run from the root of the project that make life a little easier.

To run the following commands, from the root of the project simply type:

    yarn <command>

- `build:data` - Builds the shared/data-models package
- `build:utils` - Builds the shared/universal-utils package
- `build:shared` - Builds both of the above concurrently
- `dev:api` - Starts the api-server in development mode
- `dev:bot` - Starts the discord-bot in development mode
- `dev:front` - Starts the frontend in development mode
- `build:api` - Builds the api-server for production
- `build:bot` - Builds the dicsord-bot for production
- `build:front` - Builds the frontend for production
- `start:api` - Starts the api-server from production mode (must be built first)
- `start:bot` - Starts the discord-bot from production mode (must be built first)
- `clean:shared` - Deletes the node_modules folder for all the shared/\* modules
- `clean:packages` - Deletes the node_modules folder for all the packages/\* modules
- `clean` - Deletes all node_modules folders everywhere
- `clean:out` - Deletes all built projects
- `clean:all` - Deletes all built projects & node_modules
- `lint` - Provides a lint output of all the files in the entire project
- `lint:fix` - Attempts to lint and fix all the files in the entire project
