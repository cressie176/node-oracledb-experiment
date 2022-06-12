import { Express } from 'express';
import { Server } from 'http';
import logger from './logger';

export type WebServerOptions = {
  app: Express;
  port: number;
};

export default class WebServer implements Component {
  private _app: Express;
  private _server: Server;
  private _port: number;

  constructor(options: WebServerOptions) {
    this._app = options.app;
    this._port = options.port;
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
        logger.info(`WebServer has stopped listening`);
        resolve();
      });
    });
  }

  get baseUrl(): string {
    return `http://localhost:${this._port}`;
  }
}
