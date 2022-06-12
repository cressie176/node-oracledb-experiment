import Database from './Database';
import WebServer from './WebServer';
import logger from './logger';
import routes from './routes';

const DEFAULT_HTTP_PORT = Number(process.env.HTTP_SERVER_PORT) || 3000;

export default class Application implements Component {
  private _database: Database;
  private _webServer: WebServer;

  constructor(database: Database = new Database(), port: number = DEFAULT_HTTP_PORT) {
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
