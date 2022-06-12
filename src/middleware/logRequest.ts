import { NextFunction, Request, Response } from 'express';
import logger from '../logger';

type LogRequest = {
  method: string;
  url: string;
  route: string;
  params: any;
  start: number;
  duration?: number;
  statusCode?: number;
};

export default () => async (req: Request, res: Response, next: NextFunction) => {
  const request: LogRequest = {
    method: req.method,
    url: req.originalUrl,
    route: req.route.path,
    params: req.params,
    start: Date.now()
  };

  res.once('finish', function () {
    request.duration = Date.now() - request.start;
    request.statusCode = this.statusCode;

    if (request.statusCode < 400) {
      logger.info(`${request.method} ${request.url} ${request.statusCode}`, { request });
    } else {
      logger.error(`${request.method} ${request.url} ${request.statusCode}`, { request });
    }
  });

  next();
};
