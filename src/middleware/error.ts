import { NextFunction, Request, Response } from 'express';
import logger from '../logger';

export type ErrorResponse = {
  message: string;
};

export default () => (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);
  res.status(500);
  res.json({ message: 'Internal Server Error' });
};
