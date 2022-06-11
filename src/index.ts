import Database  from './Database';
import { Logger } from 'tripitaka';
const logger = new Logger();

const signals = ['SIGINT', 'SIGTERM'];

(async () => {
  const database = new Database({
    libDir: process.env.LD_LIBRARY_PATH,
    user: process.env.NODE_ORACLEDB_USER,
    password: process.env.NODE_ORACLEDB_PASSWORD,
    connectionString: process.env.NODE_ORACLEDB_CONNECTION_STRING,
    maxAttempts: Number(process.env.NODE_ORACLEDB_CONNECTION_MAX_ATTEMPTS) || undefined,
    retryInterval: Number(process.env.NODE_ORACLEDB_CONNECTION_RETRY_INTERVAL) || undefined,
    migrate: Boolean(process.env.NODE_ORACLEDB_MIGRATE) || undefined,
  });
  await database.start();

  signals.forEach((signal) => {
    process.once(signal, async () => {
      await database.stop();
    })
  })

})();
