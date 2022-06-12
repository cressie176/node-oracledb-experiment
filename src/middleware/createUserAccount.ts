import { NextFunction, Request, Response } from 'express';
import Database from '../Database';
import * as yup from 'yup';

const schema = yup.object().shape({
  system: yup.string().required(),
  username: yup.string().required(),
  password: yup.string().required()
});

export default (database: Database) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = await schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    await database.createUserAccount(params);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
