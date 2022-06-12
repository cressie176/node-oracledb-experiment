# node-oracledb-experiment

Experimenting with Node.js and OracleDB

## Local setup (first time only)

### Prerequisits

- docker
- docker-compose
- node.js >= v16.0.0

### Installation

1. Clone this repo
   ```
   git clone git@github.com:cressie176/node-oracledb-experiment.git
   ```
1. Run npm install
   ```
   cd node-oracledb-experiment
   npm i
   ```
1. Test the application
   ```
   npm t
   ```
1. Start the application

   ```
   npm run dev
   ```

## Configuration

| Name                               | Type    | Default | Notes                                                                                                                 |
| ---------------------------------- | ------- | ------- | --------------------------------------------------------------------------------------------------------------------- |
| NODE_ENV                           | String  |         | Set to one of "production", "development" or "test". Should be set to "production" unless you know what you are doing |
| LD_LIBRARY_PATH                    | String  |         | File path to the oracle client libraries                                                                              |
| NODE_ORACLEDB_USER                 | String  |         | The [node oracledb}(https://www.npmjs.com/package/oracledb) user                                                      |
| NODE_ORACLEDB_PASSWORD             | String  |         | The [node oracledb}(https://www.npmjs.com/package/oracledb) password                                                  |
| NODE_ORACLEDB_CONNECTION_STRING    | String  |         | The [node oracledb}(https://www.npmjs.com/package/oracledb) connection string                                         |
| DATABASE_CONNECTION_MAX_ATTEMPTS   | Number  | 100     | The number of times the application will attempt to reconnect to the database on startup                              |
| DATABASE_CONNECTION_RETRY_INTERVAL | Number  | 1000    | The number of milliseconds the application will wait before attempting to reconnect to the database on startup        |
| DATABASE_MIGRATE                   | Boolean | false   | Will run database migrations on startup when true                                                                     |
| HTTP_SERVER_PORT                   | Number  | 3000    | The HTTP port to listen on                                                                                            |

## API

### GET /\_\_/health

#### Response Body

| NAME | TYPE | NOTES |
| ok | Boolean | true when the application is healthy, false otherwise

### POST /api/user-account

#### Request Body

TODO

#### Response Body

TODO

### POST /api/user-account/reset

#### Request Body

TODO

#### Response Body

TODO

## Design Decisions

### Running everyting in a container

Applications which use oracle require a [local installation](https://oracle.github.io/node-oracledb/INSTALL.html#-3-node-oracledb-installation-instructions) of the Oracle client libraries. To avoid simplify this process, we have created docker images and a docker compose file with the libraries pre-installed, and always the application / tests from within a container for local development via docker-compose.

### Connection management

According to [the documentation](https://oracle.github.io/node-oracledb/doc/api.html#parallelism), the node oracledb driver connections cannot be used concurrently, but it is safe to share a connection with proper use of async/await. A low traffic application may consider creating a new connection per request, providing it is careful to always disconnect. A better alternative for low traffic applications is to use single shared connection, and tp consider what happens if the connection is closed. This application assumes that the platform will monitor it's health endpoint and restart it if the endpoingt reports that it is unhealthy. Busy applications should always use a connection pool.

## Further Reading

1. https://oracle.github.io/node-oracledb/doc/api.html
