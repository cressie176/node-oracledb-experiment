import oracledb, { InitialiseOptions, ConnectionAttributes } from 'oracledb';
import { setTimeout } from 'timers/promises';
import { Logger } from 'tripitaka';
const logger = new Logger();

type DatabaseOptions = {
  libDir: string | undefined,
  user: string | undefined,
  password: string | undefined,
  connectionString: string | undefined,
  retries: number | undefined,
  interval: number | undefined,
}

class Database {
  _connection: oracledb.Connection;

  async start(options?: DatabaseOptions) {
    const { 
      libDir = process.env.LD_LIBRARY_PATH,
      user = process.env.NODE_ORACLEDB_USER,
      password = process.env.NODE_ORACLEDB_PASSWORD,
      connectionString = process.env.NODE_ORACLEDB_CONNECTION_STRING,
      retries = Number(process.env.NODE_ORACLEDB_CONNECTION_RETRIES) || 100, 
      interval = Number(process.env.NODE_ORACLEDB_CONNECTION_INTERVAL) || 1000, 
    } = options || {};

    this._init({ libDir });
    await this._connect(user, password, connectionString, retries, interval);
    await this._validate();
  }

  async stop() {
    this._disconnect();
  }

  _init(options: InitialiseOptions) {
    oracledb.initOracleClient(options);    
  }

  async _connect(user: string, password: string, connectionString: string, retries: number, interval: number) {
    let attempt = 0;
    do {
      try {
        attempt++;
        logger.info(`Connecting to ${connectionString} attempt ${attempt} of ${retries}`)
        this._connection = await oracledb.getConnection({ user, password, connectionString });
      } catch (error) {
        logger.error(error);
        await setTimeout(interval);
      }
    } while (!this._connection && attempt <= retries);   
    logger.info(`Successfully connected to ${connectionString}`)
  }

  async _validate() {
    const result = await this._connection.execute('SELECT 1 FROM DUAL');
    if (!result || result.rows.length !== 1) throw new Error(`Test query failed`);
  }

  async _disconnect() {
    if (!this._connection) return;
    await this._connection.close();
  }
}

export default Database