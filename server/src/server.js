const app = require('./app');
const { config, validateConfig } = require('./config/env');
const { connectDatabase } = require('./config/db');

async function start() {
  validateConfig();
  await connectDatabase();
  const server = app.listen(config.port, () => {
    console.info(`Online Bookstore API listening on port ${config.port}`);
  });
  const shutdown = async (signal) => {
    console.info(`${signal} received. Shutting down.`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error('Unable to start the server:', error.message);
  process.exitCode = 1;
});
