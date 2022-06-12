import { ok, strictEqual as eq, rejects } from 'assert';
import { afterEach, beforeEach, describe, it } from 'zunit';
import bent from 'bent';
import Application from '../src/Application';
import Database from '../src/Database';
import { HealthResponse } from '../src/middleware/health';
import { CreateUserAccountResponse } from '../src/middleware/createUserAccount';
import { ErrorResponse } from '../src/middleware/error';

export default describe('Application', () => {
  let application: Application;
  let database: Database;

  beforeEach(async () => {
    await startApplication();
  });

  afterEach(async () => {
    await stopApplication();
  });

  describe('/__/health', () => {
    it('returns healthy', async () => {
      const { ok } = await health();
      eq(ok, true);
    });

    it('returns unhealthy', async () => {
      await database.stop();
      const { ok } = await health();
      eq(ok, false);
    });
  });

  describe('API Errors', () => {
    it('handles missing resources', async () => {
      const { message } = await request({ path: '/invalid', statusCode: 404 });
      eq(message, 'Not Found');
    });

    it('handles general errors', async () => {
      await database.stop();
      const { message } = await error({ method: 'POST', path: '/api/user-account', statusCode: 500 });
      eq(message, 'Internal Server Error');
    });
  });

  async function startApplication() {
    database = new Database({ migrate: true });
    application = new Application(database);
    await application.start();
  }

  async function stopApplication() {
    return application.stop();
  }

  async function health(): Promise<HealthResponse> {
    return request({ path: '/__/health' });
  }

  async function error({ method, path, statusCode }: { method: string; path: string; statusCode: number }): Promise<ErrorResponse> {
    return request({ method, path, statusCode });
  }

  async function createUserAccount({ statusCode = 200 }: { statusCode: number }): Promise<CreateUserAccountResponse> {
    return request({ method: 'POST', path: '/api/create-user-account', statusCode });
  }

  async function request({ method = 'GET', path, statusCode = 200 }: { method?: string; path: string; statusCode?: number }): Promise<any> {
    const getStream = bent(method, application.baseUrl, statusCode);
    const stream = await getStream(path);
    // @ts-ignore
    eq(stream.statusCode, statusCode);
    // @ts-ignore
    return stream.json();
  }
});
