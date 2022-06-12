import { NextFunction, Request, Response } from 'express';
import Database from '../Database';

export type ResetUserAccountResponse = {};

export default (database: Database) => async (req: Request, res: Response, next: NextFunction) => {
  next(new Error('Not Implemented Yet'));
};
