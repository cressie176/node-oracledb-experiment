import { NextFunction, Request, Response } from 'express';
import logger from '../logger';

export type NotFoundResponse = {
  message: string;
};

export default () => (req: Request, res: Response, next: NextFunction) => {
  logger.error(new Error('Not Found'));
  res.status(404);
  res.json({ message: 'Not Found' });
};
