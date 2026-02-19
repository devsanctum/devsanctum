import { FastifyPluginAsync } from 'fastify';
import prisma from '../config/database.js';
import { config } from '../config/index.js';

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/health',
    {
      schema: {
        tags: ['health'],
        description: 'Health check endpoint',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              environment: { type: 'string' },
              database: { type: 'string' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      let dbStatus = 'disconnected';
      try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
      } catch (error) {
        fastify.log.error({ error }, 'Database health check failed');
      }

      return reply.send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config.env,
        database: dbStatus,
      });
    },
  );

  fastify.get(
    '/health/ready',
    {
      schema: {
        tags: ['health'],
        description: 'Readiness probe endpoint',
        response: {
          200: {
            type: 'object',
            properties: {
              ready: { type: 'boolean' },
            },
          },
          503: {
            type: 'object',
            properties: {
              ready: { type: 'boolean' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return reply.send({ ready: true });
      } catch (error) {
        return reply.code(503).send({
          ready: false,
          error: 'Database is not ready',
        });
      }
    },
  );
};

export default healthRoutes;
