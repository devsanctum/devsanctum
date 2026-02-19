import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

describe('Health Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('status', 'ok');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('environment');
      expect(body).toHaveProperty('database');
    });
  });

  describe('GET /api/v1/health/ready', () => {
    it('should return readiness status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health/ready',
      });

      expect([200, 503]).toContain(response.statusCode);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('ready');
    });
  });
});
