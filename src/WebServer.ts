import { Express } from 'express';
import { Server } from 'http';
import logger from './logger';

const DEFAULT_HTTP_PORT = 3000;

export type WebServerOptions = {
  app: Express;
  port?: number;
};

export default class WebServer implements Component {
  private _app: Express;
  private _server: Server;
  private _port: number;

  constructor(options: WebServerOptions) {
    this._app = options.app;
    this._port = options.port || Number(process.env.HTTP_SERVER_PORT) || DEFAULT_HTTP_PORT;
    this._server = null;
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this._server) return reject(new Error('WebServer has already started'));
      this._server = this._app.listen(this._port, () => {
        logger.info(`WebServer is listening on port ${this._port}`);
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this._server) return;
      this._server.close((err) => {
        if (err) return reject(err);
        this._server = null;
        logger.info(`WebServer has stopped listening`);
        resolve();
      });
    });
  }

  get isRunning() {
    return Boolean(this._server);
  }

  get baseUrl(): string {
    return `http://localhost:${this._port}`;
  }
}
