import { NextFunction, Request, Response } from 'express';
import logger from '../logger';

export type NotFoundResponse = {
  message: string;
};

export default () => (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ message: 'Not Found' });
};
