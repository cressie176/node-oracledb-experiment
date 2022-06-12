import { NextFunction, Request, Response } from 'express';
import logger from '../logger';

export type ErrorResponse = {
  message: string;
};

export default () => (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err.name === 'ValidationError') {
    res.status(400).json(err);
  } else {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
