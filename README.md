# node-oracledb-experiment

Experimenting with Node.js and OracleDB

## Configuration

| NAME                               | TYPE    | DEFAULT | NOTES                                                                                                                 |
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

## Design Decisions

1. Pool, connection per request, or shared
   https://oracle.github.io/node-oracledb/doc/api.html#parallelism

## Further Reading

https://oracle.github.io/node-oracledb/doc/api.html

## Local Development

```
npm run dev
```

## Running Tests

```
npm run test
```
