import Application from './Application';
import logger from './logger';

(async () => {
  const application = new Application();
  await application.start();

  ['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.once(signal, async () => {
      logger.info(`Received ${signal}, commencing shutdown`);
      await application.stop();
    });
  });
})();
