import { ok, strictEqual as eq, rejects } from 'assert';
import { afterEach, beforeEach, describe, it } from 'zunit';
import Database from '../src/Database';
import logger from '../src/LoggerFactory';

export default describe('Database', () => {
  beforeEach(() => {
    logger.disable();
  });

  afterEach(() => {
    logger.enable();
  });

  it('should connect', async () => {
    const database = new Database({
      libDir: process.env.LD_LIBRARY_PATH,
      user: process.env.NODE_ORACLEDB_USER,
      password: process.env.NODE_ORACLEDB_PASSWORD,
      connectionString: process.env.NODE_ORACLEDB_CONNECTION_STRING
    });

    await database._connect();
    const connected = await database.validate();
    ok(connected);
  });

  it('should handle connection errors', async () => {
    const database = new Database({
      libDir: process.env.LD_LIBRARY_PATH,
      user: 'invalid',
      password: process.env.NODE_ORACLEDB_PASSWORD,
      connectionString: process.env.NODE_ORACLEDB_CONNECTION_STRING,
      maxAttempts: 1
    });

    await rejects(
      async () => {
        await database._connect();
      },
      (err: any) => {
        eq(err.errorNum, 1017);
        return true;
      }
    );
  });
});
