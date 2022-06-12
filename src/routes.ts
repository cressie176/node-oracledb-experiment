import express, { Express, Router } from 'express';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import Database from './Database';
import health from './middleware/health';
import notFound from './middleware/notFound';
import error from './middleware/error';
import logRequest from './middleware/logRequest';
import createUserAccount from './middleware/createUserAccount';
import resetUserAccount from './middleware/resetUserAccount';

export default (database: Database): Express => {
  const app = express();
  app.use(helmet());
  app.disable('etag');
  app.use(bodyParser.json());
  app.use('/api', apiRouter(app, database));
  app.use('/__', systemRouter(app, database));
  app.use(notFound());
  app.use(error());
  return app;
};

function apiRouter(app: Express, database: Database) {
  const router = Router();
  router.post('/user-account', logRequest(), createUserAccount(database));
  router.post('/user-account/reset', logRequest(), resetUserAccount(database));
  return router;
}

function systemRouter(app: Express, database: Database) {
  const router = Router();
  router.get('/health', health(database));
  return router;
}
