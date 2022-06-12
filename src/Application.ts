import Database from './Database';
import WebServer from './WebServer';
import logger from './logger';
import routes from './routes';

const defaultDatabase = new Database({
  libDir: process.env.LD_LIBRARY_PATH,
  user: process.env.NODE_ORACLEDB_USER,
  password: process.env.NODE_ORACLEDB_PASSWORD,
  connectionString: process.env.NODE_ORACLEDB_CONNECTION_STRING,
  maxAttempts: Number(process.env.NODE_ORACLEDB_CONNECTION_MAX_ATTEMPTS) || undefined,
  retryInterval: Number(process.env.NODE_ORACLEDB_CONNECTION_RETRY_INTERVAL) || undefined,
  migrate: String(process.env.NODE_ORACLEDB_MIGRATE).toUpperCase() === 'TRUE'
});

const defaultPort = Number(process.env.HTTP_SERVER_PORT) || 3000;

export default class Application implements Component {
  private _database: Database;
  private _webServer: WebServer;

  constructor(database: Database = defaultDatabase, port: number = defaultPort) {
    this._database = database;
    this._webServer = new WebServer({ app: routes(database), port });
  }

  async start() {
    logger.info('Starting');
    await this._database.start();
    await this._webServer.start();
    logger.info('Started');
  }

  async stop() {
    logger.info('Stopping');
    await this._webServer.stop();
    await this._database.stop();
    logger.info('Stopped');
  }

  get baseUrl(): string {
    return this._webServer.baseUrl;
  }
}
