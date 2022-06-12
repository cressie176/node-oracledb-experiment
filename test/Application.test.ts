import { ok, strictEqual as eq, rejects } from 'assert';
import { afterEach, beforeEach, describe, it } from 'zunit';
import bent, { BentResponse } from 'bent';
import { ValidationError } from 'yup';
import Application from '../src/Application';
import Database from '../src/Database';
import { HealthResponse } from '../src/middleware/health';
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

  describe('POST /api/user-account', async () => {
    it('should create a new user account', async () => {
      await createUserAccount({ system: 'Moria', username: 'Gandalf1954', password: 'mellon' });

      const userAccount = await database.getUserAccount({ system: 'Moria', username: 'Gandalf1954' });
      eq(userAccount.system, 'Moria');
      eq(userAccount.username, 'Gandalf1954');
      eq(userAccount.password, 'mellon');
      eq(userAccount.lockedAt, null);
    });

    it('should report missing properties', async () => {
      const { message, errors } = (await createUserAccount({}, 400)) as ValidationError;
      eq(message, '3 errors occurred');
      eq(errors.length, 3);
      eq(errors[0], 'system is a required field');
      eq(errors[1], 'username is a required field');
      eq(errors[2], 'password is a required field');
    });
  });

  describe('POST /api/user-account/reset', async () => {
    it('should reset an existing account', async () => {
      await database.createUserAccount({ system: 'Moria', username: 'Gandalf1954', password: 'mellon' });
      await database.lockUserAccount({ system: 'Moria', username: 'Gandalf1954' });

      await resetUserAccount({ system: 'Moria', username: 'Gandalf1954', password: 'coth' });

      const userAccount = await database.getUserAccount({ system: 'Moria', username: 'Gandalf1954' });
      eq(userAccount.system, 'Moria');
      eq(userAccount.username, 'Gandalf1954');
      eq(userAccount.password, 'coth');
      eq(userAccount.lockedAt, null);
    });

    it('should report missing properties', async () => {
      const { message, errors } = (await resetUserAccount({}, 400)) as ValidationError;
      eq(message, '3 errors occurred');
      eq(errors.length, 3);
      eq(errors[0], 'system is a required field');
      eq(errors[1], 'username is a required field');
      eq(errors[2], 'password is a required field');
    });

    it('should report a missing account', async () => {
      const { message } = (await resetUserAccount({ system: 'Moria', username: 'Gandalf1954', password: 'coth' }, 500)) as ErrorResponse;
      eq(message, 'Internal Server Error');
    });
  });

  describe('API Errors', () => {
    it('handles missing resources', async () => {
      const { message } = await request({ path: '/invalid', statusCode: 404 });
      eq(message, 'Not Found');
    });
  });

  async function startApplication() {
    database = new Database({ migrate: true });
    application = new Application(database);
    await application.start();
    await database.deleteTestData();
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

  async function createUserAccount(body: { system?: string; username?: string; password?: string }, statusCode: number = 204): Promise<void | ValidationError | ErrorResponse> {
    return request({ method: 'POST', path: '/api/user-account', body, statusCode });
  }

  async function resetUserAccount(body: { system?: string; username?: string; password?: string }, statusCode: number = 204): Promise<void | ValidationError | ErrorResponse> {
    return request({ method: 'POST', path: '/api/user-account/reset', body, statusCode });
  }

  async function request({ method = 'GET', path, statusCode = 200, body }: { method?: string; path: string; body?: any; statusCode?: number }): Promise<any> {
    const getStream = bent(method, application.baseUrl, statusCode);
    const stream = (await getStream(path, body)) as BentResponse;
    eq(stream.statusCode, statusCode);
    return stream.statusCode === 204 ? undefined : stream.json();
  }
});
