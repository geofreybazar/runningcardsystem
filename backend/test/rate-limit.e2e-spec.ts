import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from './helpers.js';

// Low limits and a trusted proxy, read when the app modules are imported (inside createApp).
describe('rate limits behind a proxy', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;

  beforeAll(async () => {
    Object.assign(process.env, { LOGIN_RATE_LIMIT: '2', GLOBAL_RATE_LIMIT: '4', TRUST_PROXY: '1' });
    app = await createApp();
    http = request(app.getHttpServer());
  });
  afterAll(async () => {
    delete process.env.TRUST_PROXY;
    await app.close();
  });

  const login = (ip: string) => http.post('/api/auth/login').set('X-Forwarded-For', ip).send({ accountNumber: 'X0000', password: 'wrong-pass' });

  it('limits sign-ins per client, not per proxy', async () => {
    await login('203.0.113.1').expect(401);
    await login('203.0.113.1').expect(401);
    await login('203.0.113.1').expect(429);
    await login('203.0.113.2').expect(401); // another client behind the same proxy is not blocked
  });

  it('pauses an account after 5 wrong passwords, from any IP, without affecting other accounts', async () => {
    const attempt = (acct: string, ip: string) => http.post('/api/auth/login').set('X-Forwarded-For', ip).send({ accountNumber: acct, password: 'wrong-pass' });
    // Each try from a different IP, like a dynamic or rotating connection.
    for (let i = 0; i < 5; i++) await attempt('Z5001', `198.51.100.${i + 1}`).expect(401);
    const paused = await attempt('Z5001', '198.51.100.99').expect(429);
    expect(paused.body.message).toMatch(/Try again in 5 minutes/);
    await attempt('z5001', '198.51.100.98').expect(429); // same account in lowercase
    await attempt('Z5002', '198.51.100.97').expect(401); // another account still checks normally
  });

  it('limits every other route too', async () => {
    const refresh = () => http.post('/api/auth/refresh').set('X-Forwarded-For', '203.0.113.9');
    for (let i = 0; i < 4; i++) await refresh().expect(401);
    await refresh().expect(429);
  });
});
