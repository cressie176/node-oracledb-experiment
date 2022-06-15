import Database from '../src/Database';
import { Hook, Suite } from 'zunit';
import applicationTests from './Application.test';
import databaseTests from './Database.test';
import logger from '../src/logger';

const initDatabase = new Hook(
  'Initialise Database',
  async () => {
    const database = new Database();
    await database.start();
    await database.stop();
  },
  { timeout: 60000 }
);

const disableLogger = new Hook('Disable Logger', () => {
  logger.disable();
});

export default new Suite('All Tests').before(disableLogger).before(initDatabase).beforeEach(disableLogger).add(databaseTests).add(applicationTests);
