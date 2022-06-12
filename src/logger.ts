import { AsyncLocalStorage } from 'async_hooks';
import { Level, Logger, processors, transports } from 'tripitaka';
import pkg from '../package.json';

export default new Logger({
  level: Level.lookup(process.env.LOGGING_LEVEL) || Level.INFO,
  processors: [
    processors.context(),
    processors.augment({
      source: {
        logger: {
          name: pkg.name,
          version: pkg.version
        }
      }
    }),
    processors.timestamp(),
    processors.json()
  ],
  transports: [transports.stream(), transports.emitter()]
});
