import fs from 'fs';
import path from 'path';
import { setTimeout } from 'timers/promises';
import oracledb, { InitialiseOptions, ConnectionAttributes } from 'oracledb';
import marv from 'marv/api/promise';
import driver from 'marv-oracledb-driver';
import logger from './logger';

const VALIDATE_CONNECTION_SQL = loadSql('validate-connection.sql');
const GET_USER_ACCOUNT_BY_SYSTEM_AND_USERNAME = loadSql('get-user-account-by-system-and-username.sql');
const CREATE_USER_ACCOUNT_SQL = loadSql('create-user-account.sql');
const RESET_USER_ACCOUNT_SQL = loadSql('reset-user-account.sql');
const LOCK_USER_ACCOUNT_SQL = loadSql('lock-user-account.sql');
const DELETE_TEST_USER_ACCOUNTS_SQL = loadSql('delete-test-user-accounts.sql');

const DEFAULT_DATABASE_CONNECTION_MAX_ATTEMPTS = 100;
const DEFAULT_DATABASE_CONNECTION_RETRY_INTERVAL = 1000;

let oracleClientInitialised = false;
let migrated = false;

export type DatabaseOptions = {
  libDir?: string;
  errorOnConcurrentExecute?: boolean | string | undefined;
  user?: string;
  password?: string;
  connectionString?: string;
  maxAttempts?: number | string | undefined;
  retryInterval?: number | string | undefined;
  migrate?: boolean | string | undefined;
};

type CanonicalDatabaseOptions = {
  libDir: string | undefined;
  errorOnConcurrentExecute: boolean | undefined;
  user: string | undefined;
  password: string | undefined;
  connectionString: string | undefined;
  maxAttempts: number;
  retryInterval: number;
  migrate: boolean;
};

type UserAccount = {
  system: string;
  username: string;
  password: string;
  lockedAt?: Date;
};

export default class Database implements Component {
  private _options: CanonicalDatabaseOptions;
  private _connection: oracledb.Connection;

  constructor(options?: DatabaseOptions) {
    this._options = this._getOptions(options);
    this._connection = null;
  }

  async start() {
    if (!oracleClientInitialised) this._init();
    await this._connect();
    if (this._options.migrate && !migrated) await this._migrate();
    await this.validate();
  }

  async stop() {
    await this._disconnect();
  }

  get isRunning() {
    return Boolean(this._connection);
  }

  async validate() {
    if (!this._connection) throw new Error('Not connected');
    const result = await this._connection.execute(VALIDATE_CONNECTION_SQL);
    return result && result.rows && result.rows.length === 1;
  }

  async getUserAccount({ system, username }: { system: string; username: string }): Promise<UserAccount> {
    logger.debug('getUserAccount', { account: { system, username } });
    const result = await this._connection.execute(
      GET_USER_ACCOUNT_BY_SYSTEM_AND_USERNAME,
      {
        system: {
          val: system
        },
        username: {
          val: username
        }
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length > 1) throw new Error(`Multiple accounts for ${system}/${username}`);
    if (result.rows.length === 0) return null;
    return result.rows[0] as any;
  }

  async createUserAccount({ system, username, password }: { system: string; username: string; password: string }) {
    logger.debug('createUserAccount', { account: { system, username } });
    const { rowsAffected } = await this._connection.execute(CREATE_USER_ACCOUNT_SQL, {
      system: {
        val: system
      },
      username: {
        val: username
      },
      password: {
        val: password
      }
    });
    if (rowsAffected !== 1) throw new Error(`Error inserting user account for ${system}/${username}`);
  }

  async resetUserAccount({ system, username, password }: { system: string; username: string; password: string }) {
    logger.debug('resetUserAccount', { account: { system, username } });
    const { rowsAffected } = await this._connection.execute(RESET_USER_ACCOUNT_SQL, {
      system: {
        val: system
      },
      username: {
        val: username
      },
      password: {
        val: password
      }
    });

    if (rowsAffected !== 1) throw new Error(`Error reseting user account for ${system}/${username}`);
  }

  async lockUserAccount({ system, username }: { system: string; username: string }) {
    logger.debug('lockUserAccount', { account: { system, username } });
    const result = await this._connection.execute(LOCK_USER_ACCOUNT_SQL, {
      system: {
        val: system
      },
      username: {
        val: username
      },
      lockedAt: {
        val: new Date()
      }
    });
  }

  async deleteTestData() {
    if (process.env.NODE_ENV !== 'test') throw new Error(`Attempt to delete data in ${process.env.NODE_ENV} environment`);
    if (!this._connection) return;
    await this._connection.execute(DELETE_TEST_USER_ACCOUNTS_SQL);
  }

  private _getOptions({ libDir, errorOnConcurrentExecute, user, password, connectionString, maxAttempts, retryInterval, migrate }: DatabaseOptions = {}): CanonicalDatabaseOptions {
    return {
      libDir: libDir || process.env.LD_LIBRARY_PATH,
      errorOnConcurrentExecute: String(errorOnConcurrentExecute).toUpperCase() === 'TRUE' || String(process.env.NODE_ORACLEDB_ERROR_ON_CONCURRENT_EXECUTE).toUpperCase() === 'TRUE',
      user: user || process.env.NODE_ORACLEDB_USER,
      password: password || process.env.NODE_ORACLEDB_PASSWORD,
      connectionString: connectionString || process.env.NODE_ORACLEDB_CONNECTION_STRING,
      maxAttempts: Number(maxAttempts) || Number(process.env.DATABASE_CONNECTION_MAX_ATTEMPTS) || DEFAULT_DATABASE_CONNECTION_MAX_ATTEMPTS,
      retryInterval: Number(retryInterval) || Number(process.env.DATABASE_CONNECTION_RETRY_INTERVAL) || DEFAULT_DATABASE_CONNECTION_RETRY_INTERVAL,
      migrate: String(migrate).toUpperCase() === 'TRUE' || String(process.env.DATABASE_MIGRATE).toUpperCase() === 'TRUE'
    };
  }

  private _init() {
    oracledb.initOracleClient(this._options);
    oracledb.autoCommit = true;
    oracledb.errorOnConcurrentExecute = this._options.errorOnConcurrentExecute;
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
    migrated = true;
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

function loadSql(fileName: string) {
  return fs.readFileSync(path.join('src', 'sql', 'queries', fileName), 'utf-8');
}
