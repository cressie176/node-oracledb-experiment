import Database  from './Database';
import { Logger } from 'tripitaka';
const logger = new Logger();

const signals = ['SIGINT', 'SIGTERM'];

(async () => {
  const database = new Database();
  await database.start();

  signals.forEach((signal) => {
    process.once(signal, async () => {
      await database.stop();
    })
  })

})();
