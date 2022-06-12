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
    await database.deleteTestData();
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
      await database.createUserAccount({ system: 'Moria', username: 'Gandalf1954', password: 'friend' });

      const userAccount = await database.getUserAccount({ system: 'Moria', username: 'Gandalf1954' });

      eq(userAccount.system, 'Moria');
      eq(userAccount.username, 'Gandalf1954');
      eq(userAccount.password, 'friend');
      eq(userAccount.lockedAt, null);
    });
  });

  describe('reset user account', () => {
    it('should reset a user account', async () => {
      await startNewDatabase();
      await database.createUserAccount({ system: 'Moria', username: 'Gandalf1954', password: 'friend' });
      await database.lockUserAccount({ system: 'Moria', username: 'Gandalf1954' });
      let userAccount = await database.getUserAccount({ system: 'Moria', username: 'Gandalf1954' });
      ok(userAccount.lockedAt);

      await database.resetUserAccount({ system: 'Moria', username: 'Gandalf1954', password: 'enemy' });

      userAccount = await database.getUserAccount({ system: 'Moria', username: 'Gandalf1954' });
      eq(userAccount.password, 'enemy');
      eq(userAccount.lockedAt, null);
    });

    it('should tolerate reseting an unlocked user account', async () => {
      await startNewDatabase();
      await database.createUserAccount({ system: 'Moria', username: 'Gandalf1954', password: 'friend' });

      await database.resetUserAccount({ system: 'Moria', username: 'Gandalf1954', password: 'enemy' });

      const userAccount = await database.getUserAccount({ system: 'Moria', username: 'Gandalf1954' });
      eq(userAccount.password, 'enemy');
      eq(userAccount.lockedAt, null);
    });

    it('should ignore other user accounts in the same system', async () => {
      await startNewDatabase();
      await database.createUserAccount({ system: 'Moria', username: 'Gandalf1954', password: 'friend' });
      await database.createUserAccount({ system: 'Moria', username: 'Frodo2020', password: 'whatever' });

      await database.lockUserAccount({ system: 'Moria', username: 'Gandalf1954' });
      await database.lockUserAccount({ system: 'Moria', username: 'Frodo2020' });

      await database.resetUserAccount({ system: 'Moria', username: 'Gandalf1954', password: 'enemy' });

      const userAccount = await database.getUserAccount({ system: 'Moria', username: 'Frodo2020' });
      ok(userAccount.lockedAt);
    });

    it('should ignore user accounts in other systems', async () => {
      await startNewDatabase();
      await database.createUserAccount({ system: 'Moria', username: 'Gandalf1954', password: 'friend' });
      await database.createUserAccount({ system: 'The Shire', username: 'Gandalf1954', password: 'friend' });

      await database.lockUserAccount({ system: 'Moria', username: 'Gandalf1954' });
      await database.lockUserAccount({ system: 'The Shire', username: 'Gandalf1954' });

      await database.resetUserAccount({ system: 'Moria', username: 'Gandalf1954', password: 'enemy' });

      const userAccount = await database.getUserAccount({ system: 'The Shire', username: 'Gandalf1954' });
      ok(userAccount.lockedAt);
    });

    it('should report missing user accounts', async () => {
      await startNewDatabase();
      await rejects(database.resetUserAccount({ system: 'Moria', username: 'Gandalf1954', password: 'enemy' }), (err: Error) => {
        eq(err.message, 'Error reseting user account for Moria/Gandalf1954');
        return true;
      });
    });
  });

  async function startNewDatabase() {
    database = new Database();
    await database.start();
    await database.deleteTestData();
  }
});
