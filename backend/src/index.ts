import { buildApp } from './app.js';
import { config } from './config/index.js';
import prisma from './config/database.js';

async function main() {
  try {
    // Build Fastify app
    const app = await buildApp();

    // Test database connection
    await prisma.$connect();
    app.log.info('Database connected successfully');

    // Start server
    await app.listen({
      port: config.port,
      host: config.host,
    });

    app.log.info(`Server listening on http://${config.host}:${config.port}`);
    app.log.info(`API documentation available at http://${config.host}:${config.port}/docs`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

main();
