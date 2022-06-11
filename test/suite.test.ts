import { Suite } from 'zunit';
import databaseTests from './Database.test' ;

export default new Suite('All Tests')
  .add(databaseTests);