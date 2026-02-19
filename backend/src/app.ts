import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { config } from './config/index.js';
import healthRoutes from './routes/health.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.env === 'production' ? 'info' : 'debug',
      transport: config.env === 'development' ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      } : undefined,
    },
  });

  // CORS
  await app.register(cors, {
    origin: config.env === 'production' ? false : true,
    credentials: true,
  });

  // Swagger documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'DevSanctum API',
        description: 'API for DevSanctum platform - provisioning and managing containerized development environments',
        version: '0.1.0',
      },
      servers: [
        {
          url: `http://${config.host}:${config.port}`,
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'health', description: 'Health check endpoints' },
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'users', description: 'User management' },
        { name: 'groups', description: 'Group management' },
        { name: 'templates', description: 'Template management' },
        { name: 'features', description: 'Feature management' },
        { name: 'projects', description: 'Project management' },
        { name: 'workspaces', description: 'Workspace management' },
        { name: 'docker-servers', description: 'Docker server management' },
      ],
    },
  });

  await app.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // Register routes
  await app.register(healthRoutes, { prefix: '/api/v1' });

  return app;
}
