import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp, refreshCookie, signIn } from './helpers.js';

describe('auth and user management', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let superAdmin: Record<string, string>;

  beforeAll(async () => {
    app = await createApp();
    http = request(app.getHttpServer());
  });
  afterAll(() => app.close());

  it('rejects a wrong password with the same message as an unknown user', async () => {
    const wrong = await http.post('/api/auth/login').send({ username: 'superadmin', password: 'nope' }).expect(401);
    const unknown = await http.post('/api/auth/login').send({ username: 'ghost', password: 'nope' }).expect(401);
    expect(wrong.body.message).toBe(unknown.body.message);
  });

  it('blocks everything but me/change-password until the temporary password is changed', async () => {
    const login = await http.post('/api/auth/login').send({ username: 'superadmin', password: 'Initial-pass-1' }).expect(200);
    expect(login.body.user.mustChangePassword).toBe(true);
    expect(login.body).not.toHaveProperty('refreshToken');
    expect(refreshCookie(login)).toBeDefined();
    const auth = { Authorization: `Bearer ${login.body.accessToken}` };
    await http.get('/api/users').set(auth).expect(403);
    await http.get('/api/auth/me').set(auth).expect(200);

    superAdmin = await signIn(app, 'superadmin', 'Initial-pass-1', 'Super-pass-1');
    await http.get('/api/users').set(superAdmin).expect(200);
  });

  it('rotates refresh tokens and revokes the family when an old one is reused', async () => {
    const login = await http.post('/api/auth/login').send({ username: 'superadmin', password: 'Super-pass-1' }).expect(200);
    const first = refreshCookie(login)!;
    const rotated = await http.post('/api/auth/refresh').set('Cookie', first).expect(200);
    const second = refreshCookie(rotated)!;
    expect(second).not.toBe(first);
    expect(rotated.body.user.username).toBe('superadmin');

    await http.post('/api/auth/refresh').set('Cookie', first).expect(401); // reuse → family revoked
    await http.post('/api/auth/refresh').set('Cookie', second).expect(401);
  });

  it('logout revokes the refresh token', async () => {
    const login = await http.post('/api/auth/login').send({ username: 'superadmin', password: 'Super-pass-1' }).expect(200);
    const cookie = refreshCookie(login)!;
    await http.post('/api/auth/logout').set('Cookie', cookie).expect(204);
    await http.post('/api/auth/refresh').set('Cookie', cookie).expect(401);
  });

  it('enforces who can manage which accounts', async () => {
    const admin = await http.post('/api/users').set(superAdmin).send({ username: 'admin1', fullName: 'Admin One', role: 'ADMIN' }).expect(201);
    await http.post('/api/users').set(superAdmin).send({ username: 'ops1', fullName: 'Ops', role: 'OPERATIONS' }).expect(400); // needs district
    const ops = await http.post('/api/users').set(superAdmin).send({ username: 'ops1', fullName: 'Ops', role: 'OPERATIONS', districtId: 2 }).expect(201);
    expect(ops.body.user.districtId).toBe(2);

    const adminAuth = await signIn(app, 'admin1', admin.body.temporaryPassword);
    await http.post('/api/users').set(adminAuth).send({ username: 'admin2', fullName: 'X', role: 'ADMIN' }).expect(403);
    const radio = await http.post('/api/users').set(adminAuth).send({ username: 'radio1', fullName: 'Radio', role: 'RADIO_OPERATOR' }).expect(201);
    await http.patch(`/api/users/${admin.body.user.id}`).set(adminAuth).send({ fullName: 'Me' }).expect(403); // admins can't edit admins

    const radioAuth = await signIn(app, 'radio1', radio.body.temporaryPassword);
    await http.get('/api/users').set(radioAuth).expect(403);
    await http.get('/api/audit-logs').set(radioAuth).expect(403);
    await http.get('/api/audit-logs').set(adminAuth).expect(200);

    // Disabling takes effect on the very next request, even with an unexpired access token.
    await http.patch(`/api/users/${radio.body.user.id}`).set(adminAuth).send({ isActive: false }).expect(200);
    await http.get('/api/auth/me').set(radioAuth).expect(401);
    await http.post('/api/auth/login').send({ username: 'radio1', password: 'Changed-pass-1' }).expect(401);

    // Removing frees the username.
    await http.delete(`/api/users/${radio.body.user.id}`).set(adminAuth).expect(204);
    await http.post('/api/users').set(adminAuth).send({ username: 'radio1', fullName: 'Radio Again', role: 'RADIO_OPERATOR' }).expect(201);

    const log = await http.get('/api/audit-logs').set(superAdmin).expect(200);
    expect(log.body.map((e: { action: string }) => e.action)).toEqual(expect.arrayContaining(['CREATE', 'DISABLE', 'DELETE']));
  });

  it('nobody can disable or remove themselves', async () => {
    const me = await http.get('/api/auth/me').set(superAdmin).expect(200);
    await http.patch(`/api/users/${me.body.id}`).set(superAdmin).send({ isActive: false }).expect(400);
    await http.delete(`/api/users/${me.body.id}`).set(superAdmin).expect(400);
  });
});
