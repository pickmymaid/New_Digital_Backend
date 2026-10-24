const { app, dbReady } = require('./app');
const http = require('http');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 8081;
const SHUTDOWN_TIMEOUT_MS = 10000;
const server = http.createServer(app);

server.listen({ port: PORT, host: '0.0.0.0' }, () => {
  console.log(`Backend2 (auth + payment) started at port ${PORT}`);
});

// Mongoose doesn't retry a failed initial connect, so a pod that starts
// without the DB would stay up but never become ready. Exit and let the
// orchestrator restart it.
dbReady.catch((error) => {
  console.error('Database connection failed, exiting:', error.message);
  process.exit(1);
});

// A stray rejected promise (e.g. a fire-and-forget email) must not take the
// whole service down — log it and keep serving.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason?.stack || reason?.message || reason);
});

// After an uncaught exception the process state is unknown — exit and restart.
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception, exiting:', error?.stack || error);
  process.exit(1);
});

// Graceful shutdown on rollout/scale-down: stop accepting connections,
// let in-flight requests finish, then close the DB connection.
const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`);
  setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();
  server.close(async () => {
    await mongoose.disconnect().catch(() => {});
    process.exit(0);
  });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
