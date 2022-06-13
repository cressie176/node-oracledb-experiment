import { ok, strictEqual as eq, rejects } from 'assert';
import { before, after, afterEach, beforeEach, describe, it } from 'zunit';
import Database from '../src/Database';
import { DBError } from 'oracledb';

export default describe('Database', () => {
  let database: Database;

  describe('lifecycle', () => {
    afterEach(async () => {
      await database.deleteTestData();
      await database.stop();
    });

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

  describe('operation', () => {
    before(async () => {
      database = new Database();
      await database.start();
      await database.deleteTestData();
    });

    beforeEach(async () => {
      await database.deleteTestData();
    });

    after(async () => {
      await database.stop();
    });

    describe('create user account', () => {
      it('should create a user account', async () => {
        const gandalf = { system: 'Moria', username: 'Gandalf1954', password: 'mellon' };

        await database.createUserAccount(gandalf);

        const dbUserAccount = await database.getUserAccount(gandalf);
        eq(dbUserAccount.system, 'Moria');
        eq(dbUserAccount.username, 'Gandalf1954');
        eq(dbUserAccount.password, 'mellon');
        eq(dbUserAccount.lockedAt, null);
      });
    });

    describe('reset user account', () => {
      it('should reset a user account', async () => {
        const gandalf = { system: 'Moria', username: 'Gandalf1954', password: 'mellon' };
        await database.createUserAccount(gandalf);
        await database.lockUserAccount(gandalf);
        let dbUserAccount = await database.getUserAccount(gandalf);
        ok(dbUserAccount.lockedAt);

        await database.resetUserAccount({ ...gandalf, password: 'coth' });

        dbUserAccount = await database.getUserAccount(gandalf);
        eq(dbUserAccount.password, 'coth');
        eq(dbUserAccount.lockedAt, null);
      });

      it('should tolerate reseting an unlocked user account', async () => {
        const gandalf = { system: 'Moria', username: 'Gandalf1954', password: 'mellon' };
        await database.createUserAccount(gandalf);

        await database.resetUserAccount({ ...gandalf, password: 'coth' });

        const dbUserAccount = await database.getUserAccount(gandalf);
        eq(dbUserAccount.password, 'coth');
        eq(dbUserAccount.lockedAt, null);
      });

      it('should ignore other user accounts in the same system', async () => {
        const gandalf = { system: 'Moria', username: 'Gandalf1954', password: 'mellon' };
        const frodo = { system: 'Moria', username: 'Frodo1999', password: 'whatever' };
        await database.createUserAccount(gandalf);
        await database.createUserAccount(frodo);

        await database.lockUserAccount(gandalf);
        await database.lockUserAccount(frodo);

        await database.resetUserAccount({ ...gandalf, password: 'coth' });

        const dbUserAccount = await database.getUserAccount(frodo);
        ok(dbUserAccount.lockedAt);
      });

      it('should ignore user accounts in other systems', async () => {
        const gandalf1 = { system: 'Moria', username: 'Gandalf1954', password: 'mellon' };
        const gandalf2 = { system: 'The Shire', username: 'Gandalf1954', password: 'mellon' };

        await database.createUserAccount(gandalf1);
        await database.createUserAccount(gandalf2);

        await database.lockUserAccount(gandalf1);
        await database.lockUserAccount(gandalf2);

        await database.resetUserAccount({ ...gandalf1, password: 'coth' });

        const dbUserAccount = await database.getUserAccount(gandalf2);
        ok(dbUserAccount.lockedAt);
      });

      it('should report missing user accounts', async () => {
        await rejects(database.resetUserAccount({ system: 'Moria', username: 'Gandalf1954', password: 'coth' }), (err: Error) => {
          eq(err.message, 'Error reseting user account for Moria/Gandalf1954');
          return true;
        });
      });
    });
  });
});
