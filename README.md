# node-oracledb-experiment

[![Node.js CI](https://github.com/cressie176/node-oracledb-experiment/workflows/Node.js%20CI/badge.svg)](https://github.com/cressie176/node-oracledb-experiment?query=workflow%3A%22Node.js+CI%22)
[![Code Style](https://img.shields.io/badge/code%20style-prettier-brightgreen.svg)](https://github.com/prettier/prettier)

Experimenting with Node.js and OracleDB

## Contents

- [Local Setup](#local-setup)
  - [Prerequisits](#prerequisits)
  - [Installation](#installation)
  - [Development](#development)
  - [Accessing Oracle](#accessing-oracle)
- [Configuration](#configuration)
- [API](#api)
  - [GET /\_\_/health](#get-__health)
  - [POST /api/user-account](#post-apiuser-account)
  - [POST /api/user-account/reset](#post-apiuser-accountreset)
- [Design Decisions](#design-decisions)
- [Further Reading](#further-reading)

## Local Setup (Once Only)

### Prerequisits

- docker
- docker-compose
- node.js >= v16.0.0

### Installation

1. Clone this repo
   ```
   git clone git@github.com:cressie176/node-oracledb-experiment.git
   ```
1. Install the dependencies
   ```
   cd node-oracledb-experiment
   npm install
   ```
1. Test the application (may take a while when first run due to database initialisation)
   ```
   npm test
   ```

### Development

Because of the dependency on Oracle client libraries the application is run and tested in a local docker container. To do this once, run
`npm run dev` or `npm test`. If you are making a series of changes you may find it easier to run `npm run dev:watch` or `npm run test:watch` in one terminal and `npm run build:watch` in a second terminal.

### Accessing Oracle

You can get access to the local oracle container using the following properties

#### Local Application Database

| Name     | Value         |
| -------- | ------------- |
| user     | app_user      |
| password | test_password |
| hostname | localhost     |
| port     | 1521          |
| service  | XEPDB1        |

#### Local Test Database

| Name     | Value         |
| -------- | ------------- |
| user     | test_user     |
| password | test_password |
| hostname | localhost     |
| port     | 1522          |
| service  | XEPDB1        |

You can also exec into the running oracle containers in order to run sqlplus

```bash
docker exec -it node-oracledb-experiment-oracledb-app-1 bash

sqlplus app_user/app_password@XEPDB1
```

## Configuration

| Name                                      | Type    | Default                 | Notes                                                                                                                                                                                                                                             |
| ----------------------------------------- | ------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NODE_ENV                                  | String  |                         | Set to one of "production", "development" or "test". Set to "production" by the [docker build](https://github.com/cressie176/node-oracledb-experiment/blob/main/Dockerfile#L37) and should not need to be changed                                 |
| ORA_SDTZ                                  | String  | UTC                     | Sets the timezone                                                                                                                                                                                                                                 |
| LD_LIBRARY_PATH                           | String  | /opt/instantclient_21_6 | Path to the oracle client libraries. Set by the [docker build](https://github.com/cressie176/node-oracledb-experiment/blob/main/Dockerfile#L7) and should not need to be changed                                                                  |
| NODE_ORACLEDB_ERROR_ON_CONCURRENT_EXECUTE | Boolean | false                   | Throws an error if the connection is used concurrently. Not recommended in production. See [oracledb.errorOnConcurrentExecute](https://oracle.github.io/node-oracledb/doc/api.html#-325-oracledberroronconcurrentexecute)                         |
| NODE_ORACLEDB_USER                        | String  |                         | The [node oracledb](https://www.npmjs.com/package/oracledb) user                                                                                                                                                                                  |
| NODE_ORACLEDB_PASSWORD                    | String  |                         | The [node oracledb](https://www.npmjs.com/package/oracledb) password                                                                                                                                                                              |
| NODE_ORACLEDB_CONNECTION_STRING           | String  |                         | The [node oracledb](https://www.npmjs.com/package/oracledb) connection string                                                                                                                                                                     |
| DATABASE_CONNECTION_MAX_ATTEMPTS          | Number  | 100                     | The number of times the application will attempt to reconnect to the database on startup                                                                                                                                                          |
| DATABASE_CONNECTION_RETRY_INTERVAL        | Number  | 1000                    | The number of milliseconds the application will wait before attempting to reconnect to the database on startup                                                                                                                                    |
| DATABASE_MIGRATE                          | Boolean | false                   | Will run database migrations on startup when true                                                                                                                                                                                                 |
| HTTP_SERVER_PORT                          | Number  | 3000                    | The HTTP port to listen on                                                                                                                                                                                                                        |
| LOGGING_LEVEL                             | String  | INFO                    | Determines the minimum logging level. Can be one of "TRACE", "DEBUG", "INFO", "WARN", "ERROR", or "FATAL"                                                                                                                                         |
| DEBUG                                     | String  |                         | Many of the bundled node libraries use [debug](https://www.npmjs.com/package/debug). Set this environment variable to `DEBUG=*` to enable all debug or something like `DEBUG=marv:*,express:\*` to selectively enable debug for a specific module |

## API

### GET /\_\_/health

#### Response Body

| NAME | TYPE    | NOTES                                                 |
| ---- | ------- | ----------------------------------------------------- |
| ok   | Boolean | true when the application is healthy, false otherwise |

### POST /api/user-account

#### Request Body

| NAME     | TYPE   | NOTES                                                    |
| -------- | ------ | -------------------------------------------------------- |
| system   | String | The name of the system to which the user account belongs |
| username | String |                                                          |
| password | String |                                                          |

#### Response Codes

| CODE | NOTES                  |
| ---- | ---------------------- |
| 204  | Success (no content)   |
| 400  | Bad Request            |
| 500  | Internal Server Errror |

#### Sample Request

```
curl -X POST -H 'Content-Type: application/json' -d '{ "system": "Moria", "username": "Gandalf1954", "password": "mellon" }' http://localhost:3000/api/user-account
```

### POST /api/user-account/reset

#### Request Body

| NAME     | TYPE   | NOTES                                                    |
| -------- | ------ | -------------------------------------------------------- |
| system   | String | The name of the system to which the user account belongs |
| username | String |                                                          |
| password | String |                                                          |

#### Response Codes

| CODE | NOTES                  |
| ---- | ---------------------- |
| 204  | Success (no content)   |
| 400  | Bad Request            |
| 500  | Internal Server Errror |

#### Sample Request

```
curl -X POST -H 'Content-Type: application/json' -d '{ "system": "Moria", "username": "Gandalf1954", "password": "mellon" }' http://localhost:3000/api/user-account/reset
```

## Design Decisions

### Running everyting in a container

Applications which use oracle require a [local installation](https://oracle.github.io/node-oracledb/INSTALL.html#-3-node-oracledb-installation-instructions) of the Oracle client libraries. To avoid simplify this process, we have created docker images and a docker compose file with the libraries pre-installed, and always the application / tests from within a container for local development via docker-compose.

### Connection management

According to the [documentation](https://oracle.github.io/node-oracledb/doc/api.html#parallelism), the node oracledb driver connections cannot be used concurrently, but it is safe to share a connection with proper use of async/await. A low traffic application may consider creating a new connection per request, providing it is careful to always disconnect. A better alternative for low traffic applications is to use single shared connection, and tp consider what happens if the connection is closed. This application assumes that the platform will monitor it's health endpoint and restart it if the endpoingt reports that it is unhealthy. Busy applications should always use a connection pool.

## Further Reading

1. https://oracle.github.io/node-oracledb/doc/api.html
