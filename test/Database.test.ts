import { ok, strictEqual as eq, rejects } from 'assert';
import { afterEach, beforeEach, describe, it } from 'zunit';
import Database from '../src/Database';
import { DBError } from 'oracledb';
import logger from '../src/logger';

export default describe('Database', () => {
  let database: Database;

  beforeEach(() => {
    logger.disable();
  });

  afterEach(async () => {
    await database.stop();
  });

  afterEach(() => {
    logger.enable();
  });

  describe('startup / shutdown', () => {
    it('should start', async () => {
      database = new Database();
      await database.start();
      const started = await database.validate();
      ok(started);
    });

    it('should reject repeated start attempts without stopping', async () => {
      database = new Database();
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
      database = new Database();
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
      database = new Database();
      await database.stop();
    });

    it('should tolerate stopping repeatedly', async () => {
      database = new Database();
      await database.start();
      await database.stop();
      await database.stop();
    });

    it('should restart', async () => {
      database = new Database();
      await database.start();
      await database.stop();
      await database.start();
      const started = await database.validate();
      ok(started);
    });

    it('should throw connection errors', async () => {
      database = new Database({ user: 'invalid', maxAttempts: 1 });

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
      database = new Database({ user: 'invalid', maxAttempts, retryInterval });

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

  describe('create user account', () => {
    it('should create a user account', async () => {
      await startNewDatabase();
      await database.createUserAccount({ username: 'gandalf', password: 'friend', system: 'Moria' });
    });
  });

  describe('reset user account', () => {
    it('should reset a user account', async () => {
      await startNewDatabase();
      await database.createUserAccount({ username: 'gandalf', password: 'friend', system: 'Moria' });
      await database.resetUserAccount({ username: 'gandalf', password: 'enemy', system: 'Moria' });
    });
  });

  async function startNewDatabase() {
    database = new Database();
    await database.start();
  }
});
