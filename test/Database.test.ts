import { ok, strictEqual as eq, rejects } from 'assert';
import { afterEach, beforeEach, describe, it } from 'zunit';
import Database, { DatabaseOptions } from '../src/Database';
import { DBError } from 'oracledb';
import logger from '../src/LoggerFactory';

export default describe('Database', () => {
  beforeEach(() => {
    logger.disable();
  });

  afterEach(() => {
    logger.enable();
  });

  it('should connect', async () => {
    const database = getDatabase();
    await database._connect();
    const connected = await database.validate();
    ok(connected);
  });

  it('should reject attempts to repeatedly connect', async () => {
    const database = getDatabase();
    await database._connect();
    await rejects(
      () => database._connect(),
      (err: Error) => {
        eq(err.message, 'Already connected');
        return true;
      }
    );
  });

  it('should disconnect', async () => {
    const database = getDatabase();
    await database._connect();
    await database._disconnect();
    await rejects(
      () => database.validate(),
      (err: Error) => {
        eq(err.message, 'Not connected');
        return true;
      }
    );
  });

  it('should tolerate disconnecting when never connected', async () => {
    const database = getDatabase();
    await database._disconnect();
  });

  it('should tolerate disconnecting repeatedly', async () => {
    const database = getDatabase();
    await database._connect();
    await database._disconnect();
    await database._disconnect();
  });

  it('should throw connection errors', async () => {
    const database = getDatabase({ user: 'invalid', maxAttempts: 1 });

    await rejects(
      () => database._connect(),
      (err: DBError) => {
        eq(err.errorNum, 1017);
        return true;
      }
    );
  });

  it('should retry failed connections', async () => {
    const maxAttempts = 3;
    const retryInterval = 100;
    const minDuration = maxAttempts * retryInterval;
    const database = getDatabase({ user: 'invalid', maxAttempts: 3, retryInterval: 100 });

    const before = Date.now();
    await rejects(
      () => database._connect(),
      (err: DBError) => {
        eq(err.errorNum, 1017);
        return true;
      }
    );
    const after = Date.now();

    ok(after >= before + minDuration);
  });
});

function getDatabase(options?: any): Database {
  return new Database({
    libDir: process.env.LD_LIBRARY_PATH,
    user: process.env.NODE_ORACLEDB_USER,
    password: process.env.NODE_ORACLEDB_PASSWORD,
    connectionString: process.env.NODE_ORACLEDB_CONNECTION_STRING,
    maxAttempts: 100,
    ...options
  });
}
