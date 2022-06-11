import oracledb, { InitialiseOptions, ConnectionAttributes } from 'oracledb';
import { setTimeout } from 'timers/promises';
import marv from 'marv/api/promise';
import driver from 'marv-oracledb-driver';
import path from 'path';
import logger from './LoggerFactory';

type DatabaseOptions = {
  libDir: string;
  user: string;
  password: string;
  connectionString: string;
  maxAttempts?: number | undefined;
  retryInterval?: number | undefined;
  migrate?: boolean | undefined;
};

const defaultDatabaseOptions = {
  maxAttempts: 100,
  retryInterval: 1000,
  migrate: false
};

class Database {
  private _options: DatabaseOptions;
  private _connection: oracledb.Connection;

  constructor(options: DatabaseOptions) {
    this._options = { ...defaultDatabaseOptions, ...options };
    this._connection = null;
  }

  async start() {
    this._init();
    await this._connect();
    if (this._options.migrate) await this._migrate();
    await this.validate();
  }

  async stop() {
    this._disconnect();
  }

  _init() {
    oracledb.initOracleClient(this._options);
  }

  async _migrate() {
    const { user, password, connectionString } = this._options;
    const directory = path.resolve('src', 'sql', 'migrations');
    const migrations = await marv.scan(directory);
    await marv.migrate(
      migrations,
      driver({
        oracledb,
        logger,
        connection: {
          user,
          password,
          connectionString
        }
      })
    );
  }

  async _connect() {
    const { user, password, connectionString, maxAttempts, retryInterval } = this._options;
    let attempt = 0;
    let failure;
    do {
      try {
        attempt++;
        failure = null;
        logger.info(`Connecting to ${connectionString} attempt ${attempt} of ${maxAttempts}`);
        this._connection = await oracledb.getConnection(this._options);
      } catch (error) {
        logger.error(error);
        failure = error;
        if (attempt < maxAttempts) await setTimeout(retryInterval);
      }
    } while (!this._connection && attempt < maxAttempts);
    if (failure) throw failure;
    logger.info(`Successfully connected to ${connectionString}`);
  }

  async validate() {
    const result = await this._connection.execute('SELECT 1 FROM DUAL');
    return result && result.rows && result.rows.length === 1;
  }

  async _disconnect() {
    if (!this._connection) return;
    await this._connection.close();
    this._connection = null;
  }
}

export default Database;
