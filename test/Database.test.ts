import { ok, strictEqual as eq, rejects } from 'assert';
import { afterEach, beforeEach, describe, it } from 'zunit';
import Database, { DatabaseOptions } from '../src/Database';
import { DBError } from 'oracledb';
import logger from '../src/logger';

export default describe('Database', () => {
  beforeEach(() => {
    logger.disable();
  });

  afterEach(() => {
    logger.enable();
  });

  it('should start', async () => {
    const database = new Database();
    await database.start();
    const started = await database.validate();
    ok(started);
  });

  it('should reject repeated start attempts without stopping', async () => {
    const database = new Database();
    await database.start();
    await rejects(
      () => database.start(),
      (err: Error) => {
        eq(err.message, 'Already connected');
        return true;
      }
    );
  });

  it('should stop', async () => {
    const database = new Database();
    await database.start();
    await database.stop();
    await rejects(
      () => database.validate(),
      (err: Error) => {
        eq(err.message, 'Not connected');
        return true;
      }
    );
  });

  it('should tolerate stopping when never started', async () => {
    const database = new Database();
    await database.stop();
  });

  it('should tolerate stopping repeatedly', async () => {
    const database = new Database();
    await database.start();
    await database.stop();
    await database.stop();
  });

  it('should restart', async () => {
    const database = new Database();
    await database.start();
    await database.stop();
    await database.start();
    const started = await database.validate();
    ok(started);
  });

  it('should throw connection errors', async () => {
    const database = new Database({ user: 'invalid', maxAttempts: 1 });

    await rejects(
      () => database.start(),
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
    const database = new Database({ user: 'invalid', maxAttempts, retryInterval });

    const before = Date.now();
    await rejects(
      () => database.start(),
      (err: DBError) => {
        eq(err.errorNum, 1017);
        return true;
      }
    );
    const after = Date.now();

    ok(after >= before + minDuration);
  });
});
