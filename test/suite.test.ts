import { Suite } from 'zunit';
import applicationTests from './Application.test';
import databaseTests from './Database.test';

export default new Suite('All Tests').add(databaseTests).add(applicationTests);
