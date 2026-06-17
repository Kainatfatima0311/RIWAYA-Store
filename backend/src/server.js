import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';

const start = async () => {
  await connectDB();
  const app = createApp();

  const server = app.listen(env.port, () => {
    console.log(`✓ RIWAYA API running in ${env.nodeEnv} mode on http://localhost:${env.port}`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n${signal} received — shutting down gracefully...`);
    server.close(() => {
      console.log('✓ HTTP server closed');
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Crash on unhandled rejections rather than swallowing them
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    server.close(() => process.exit(1));
  });
};

start();
