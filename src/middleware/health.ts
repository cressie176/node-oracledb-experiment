import { Request, Response } from 'express';
import logger from '../logger';
import Database from '../Database';

export type HealthResponse = {
  ok: boolean;
};

export default (database: Database) => async (req: Request, res: Response) => {
  let ok = false;
  try {
    ok = await database.validate();
  } catch (err) {
    logger.error(err);
  }
  res.json({ ok });
};
