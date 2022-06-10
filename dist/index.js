const oracledb  = require('oracledb');
const { setTimeout } = require('timers/promises');
const { Logger } = require("tripitaka");
const logger = new Logger();

const signals = ['SIGINT', 'SIGTERM'];

const config = {
  user: process.env.NODE_ORACLEDB_USER,
  password: process.env.NODE_ORACLEDB_PASSWORD,
  connectionString: process.env.NODE_ORACLEDB_CONNECTION_STRING,
};

(async () => {
  oracledb.initOracleClient({ libPath: process.env.LD_LIBRARY_PATH });

  let connection;
  do {
    try {
      connection = await oracledb.getConnection(config);
    } catch (error) {
      logger.error(error);
      await setTimeout(1000);
    }
  } while (!connection);

  signals.forEach((signal) => {
    process.once(signal, async () => {
      if (!connection) return;
      await connection.close();
    })
  })

  const result = await connection.execute('SELECT 1 FROM DUAL');
  if (result.rows.length === 1) {
    logger.info(`Connected to ${config.connectionString}`);
  }

  await connection.close();  
})();
