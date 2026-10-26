import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn } from 'node:child_process';

function runNode(args, env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      env,
      stdio: 'inherit',
    });

    child.on('error', (error) => {
      console.error(`Unable to run ${args[0]}:`, error.message);
      resolve(1);
    });
    child.on('exit', (code) => resolve(typeof code === 'number' ? code : 1));
  });
}

let mongo;
let exitCode = 1;

try {
  mongo = await MongoMemoryServer.create();
  const env = {
    ...process.env,
    NODE_ENV: 'test',
    MONGODB_URI: mongo.getUri(),
    JWT_SECRET: 'e2e-secret-long-enough',
    CLIENT_ORIGIN: 'http://127.0.0.1:5173,http://localhost:5173',
    COOKIE_SECURE: 'false',
    PAYMENT_ADAPTER: 'sandbox',
    PAYMENT_SANDBOX_MODE: 'success',
    PORT: '5000',
  };

  exitCode = await runNode(['server/scripts/seed.js'], env);
  if (exitCode === 0) {
    exitCode = await runNode([
      'node_modules/@playwright/test/cli.js',
      'test',
      ...process.argv.slice(2),
    ], env);
  }
} catch (error) {
  console.error('E2E setup failed:', error.message);
} finally {
  if (mongo) await mongo.stop();
}

process.exitCode = exitCode;
