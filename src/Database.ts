import oracledb, { InitialiseOptions, ConnectionAttributes } from 'oracledb';
import { setTimeout } from 'timers/promises';
import marv from 'marv/api/promise';
import driver from 'marv-oracledb-driver';
import path from 'path';
import logger from './logger';

let oracleClientInitialised = false;

export type DatabaseOptions = {
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

class Database implements Component {
  private _options: DatabaseOptions;
  private _connection: oracledb.Connection;
  private _initialised: any;

  constructor(options: DatabaseOptions) {
    this._options = { ...defaultDatabaseOptions, ...options };
    this._connection = null;
    oracledb.autoCommit = true;
  }

  async start() {
    this._init();
    await this._connect();
    if (this._options.migrate) await this._migrate();
    await this.validate();
  }

  async stop() {
    await this._disconnect();
  }

  async validate() {
    if (!this._connection) throw new Error('Not connected');
    const result = await this._connection.execute('SELECT 1 FROM DUAL');
    return result && result.rows && result.rows.length === 1;
  }

  private _init() {
    if (oracleClientInitialised) return;
    oracledb.initOracleClient(this._options);
    oracleClientInitialised = true;
  }

  private async _migrate() {
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

  private async _connect() {
    if (this._connection) throw new Error('Already connected');
    const { maxAttempts, retryInterval } = this._options;
    let attempt = 0;
    do {
      const err = await this._attemptConnection(++attempt);
      if (err && attempt === maxAttempts) throw err;
      if (err) await setTimeout(retryInterval);
    } while (!this._connection && attempt < maxAttempts);
  }

  private async _attemptConnection(attempt: number) {
    const { user, password, connectionString, maxAttempts } = this._options;
    try {
      logger.info(`Connecting to ${connectionString} attempt ${attempt} of ${maxAttempts}`);
      this._connection = await oracledb.getConnection(this._options);
      logger.info(`Successfully connected to ${connectionString}`);
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  private async _disconnect() {
    if (!this._connection) return;
    await this._connection.close();
    this._connection = null;
  }
}

export default Database;
