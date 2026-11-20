import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';

const app = createApp('http://localhost:5173');
describe('API foundation', () => {
  it('reports liveness without claiming database readiness', async () => {
    const health = await request(app).get('/api/health');
    expect(health.status).toBe(200);
    expect(health.body).toEqual({ status: 'ok', service: 'saferide-api' });
    const ready = await request(app).get('/api/ready');
    expect(ready.status).toBe(503);
    expect(ready.body).toEqual({ ready: false, database: 'disconnected' });
  });
  it('serves public service definitions and limits JSON size', async () => {
    const services = await request(app).get('/api/public/services');
    expect(services.status).toBe(200);
    expect(services.body).toHaveLength(6);
    const tooLarge = await request(app).post('/api/unknown').send({ data: 'x'.repeat(33_000) });
    expect(tooLarge.status).toBe(413);
  });
  it('allows only the configured browser origin', async () => {
    const allowed = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    const other = await request(app).get('/api/health').set('Origin', 'https://example.com');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(other.headers['access-control-allow-origin']).toBeUndefined();
  });
  it('accepts either loopback hostname on the same development port', async () => {
    const loopbackApp = createApp('http://127.0.0.1:5173');
    const alias = await request(loopbackApp).post('/api/auth/signup').set('Origin', 'http://localhost:5173').send({});
    expect(alias.status).toBe(400);
    expect(alias.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    const differentPort = await request(loopbackApp).post('/api/auth/signup').set('Origin', 'http://localhost:5174').send({});
    expect(differentPort.status).toBe(403);
  });
  it('allows preflight for PUT updates from the configured origin', async () => {
    const response = await request(app).options('/api/owner/ops/routes/example')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'PUT');
    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-methods']).toContain('PUT');
  });
  it('rejects an unconfigured Host when the production allowlist is supplied', async () => {
    const hosted=createApp('https://saferide.example',true,['saferide.example']);
    expect((await request(hosted).get('/api/health').set('Host','saferide.example')).status).toBe(200);
    expect((await request(hosted).get('/api/health').set('Host','other.example')).status).toBe(421);
  });
});
