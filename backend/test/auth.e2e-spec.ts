import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtSigner } from '@nestjs/authentication';
import { createApp, person, refreshCookie, signIn, superAdminAuth } from './helpers.js';

describe('auth and user management', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let superAdmin: Record<string, string>;

  beforeAll(async () => {
    app = await createApp();
    http = request(app.getHttpServer());
    superAdmin = await superAdminAuth(app); // spec files share one database and may run in any order
  });
  afterAll(() => app.close());

  it('rejects a wrong password with the same message as an unknown user', async () => {
    const wrong = await http.post('/api/auth/login').send({ accountNumber: 'superadmin', password: 'nope' }).expect(401);
    const unknown = await http.post('/api/auth/login').send({ accountNumber: 'X9999', password: 'nope' }).expect(401);
    expect(wrong.body.message).toBe(unknown.body.message);
  });

  it('blocks everything but me/change-password until the temporary password is changed', async () => {
    const created = await http.post('/api/users').set(superAdmin).send(person('A1001', 'ADMIN')).expect(201);
    const login = await http.post('/api/auth/login').send({ accountNumber: 'A1001', password: created.body.temporaryPassword }).expect(200);
    expect(login.body.user.mustChangePassword).toBe(true);
    expect(login.body).not.toHaveProperty('refreshToken');
    expect(refreshCookie(login)).toBeDefined();
    const auth = { Authorization: `Bearer ${login.body.accessToken}` };
    await http.get('/api/users').set(auth).expect(403);
    await http.get('/api/auth/me').set(auth).expect(200);

    const changed = await signIn(app, 'A1001', created.body.temporaryPassword);
    await http.get('/api/users').set(changed).expect(200);
  });

  it('rotates refresh tokens and revokes the family when an old one is reused', async () => {
    const login = await http.post('/api/auth/login').send({ accountNumber: 'superadmin', password: 'Super-pass-1' }).expect(200);
    const first = refreshCookie(login)!;
    const rotated = await http.post('/api/auth/refresh').set('Cookie', first).expect(200);
    const second = refreshCookie(rotated)!;
    expect(second).not.toBe(first);
    expect(rotated.body.user.accountNumber).toBe('SUPERADMIN');

    await http.post('/api/auth/refresh').set('Cookie', first).expect(401); // reuse → family revoked
    await http.post('/api/auth/refresh').set('Cookie', second).expect(401);
  });

  it('logout revokes the refresh token', async () => {
    const login = await http.post('/api/auth/login').send({ accountNumber: 'superadmin', password: 'Super-pass-1' }).expect(200);
    const cookie = refreshCookie(login)!;
    await http.post('/api/auth/logout').set('Cookie', cookie).expect(204);
    await http.post('/api/auth/refresh').set('Cookie', cookie).expect(401);
  });

  it('enforces who can manage which accounts', async () => {
    const admin = await http.post('/api/users').set(superAdmin).send(person('A1002', 'ADMIN')).expect(201);
    await http.post('/api/users').set(superAdmin).send(person('A1003', 'OPERATIONS')).expect(400); // Operations can't be regional
    await http.post('/api/users').set(superAdmin).send(person('A1003', 'OPERATIONS', { officeLevel: 'DISTRICT' })).expect(400); // needs district
    await http.post('/api/users').set(superAdmin).send(person('A1004', 'ADMIN', { officeLevel: 'CITY', cityId: 1 })).expect(400); // admins are regional
    const ops = await http.post('/api/users').set(superAdmin).send(person('A1003', 'OPERATIONS', { officeLevel: 'DISTRICT', districtId: 2 })).expect(201);
    expect(ops.body.user).toMatchObject({ officeLevel: 'DISTRICT', districtId: 2, cityId: null });

    // A city office gets its district from the city.
    const caloocan = (await http.get('/api/districts').set(superAdmin)).body.find((d: { code: number }) => d.code === 2).cities.find((c: { name: string }) => c.name === 'Caloocan');
    const cityRadio = await http.post('/api/users').set(superAdmin).send(person('A1005', 'RADIO_OPERATOR', { officeLevel: 'CITY', cityId: caloocan.id })).expect(201);
    expect(cityRadio.body.user).toMatchObject({ officeLevel: 'CITY', cityId: caloocan.id, districtId: 2 });

    // Manila and Quezon City are their own districts: no city-level offices there.
    const districts = (await http.get('/api/districts').set(superAdmin)).body;
    for (const code of [1, 5]) {
      const only = districts.find((d: { code: number }) => d.code === code).cities[0];
      const res = await http.post('/api/users').set(superAdmin).send(person(`A10${code}9`, 'RADIO_OPERATOR', { officeLevel: 'CITY', cityId: only.id })).expect(400);
      expect(res.body.message).toContain('fire district office');
    }
    await http.patch(`/api/users/${cityRadio.body.user.id}`).set(superAdmin).send({ cityId: districts[0].cities[0].id }).expect(400);

    const adminAuth = await signIn(app, 'A1002', admin.body.temporaryPassword);
    // Admin is regional IT: manages every account except Super Admin.
    await http.post('/api/users').set(adminAuth).send(person('A1006', 'SUPER_ADMIN')).expect(403);
    await http.post('/api/users').set(adminAuth).send(person('A1007', 'ADMIN')).expect(201);
    const radio = await http.post('/api/users').set(adminAuth).send(person('A1008', 'RADIO_OPERATOR')).expect(201);
    const superId = (await http.get('/api/auth/me').set(superAdmin)).body.id;
    await http.patch(`/api/users/${superId}`).set(adminAuth).send({ firstName: 'Hacked' }).expect(403); // admins can't edit super admins

    const radioAuth = await signIn(app, 'A1008', radio.body.temporaryPassword);
    await http.get('/api/users').set(radioAuth).expect(403);
    await http.get('/api/audit-logs').set(radioAuth).expect(403);
    await http.get('/api/audit-logs').set(adminAuth).expect(200);

    // Disabling takes effect on the very next request, even with an unexpired access token.
    await http.patch(`/api/users/${radio.body.user.id}`).set(adminAuth).send({ isActive: false }).expect(200);
    await http.get('/api/auth/me').set(radioAuth).expect(401);
    await http.post('/api/auth/login').send({ accountNumber: 'A1008', password: 'Changed-pass-1' }).expect(401);

    // Removing frees the account number.
    await http.delete(`/api/users/${radio.body.user.id}`).set(adminAuth).expect(204);
    await http.post('/api/users').set(adminAuth).send(person('A1008', 'RADIO_OPERATOR')).expect(201);

    const log = await http.get('/api/audit-logs').set(superAdmin).expect(200);
    expect(log.body.map((e: { action: string }) => e.action)).toEqual(expect.arrayContaining(['CREATE', 'DISABLE', 'DELETE']));
  });

  it('validates rank, names and the account number format', async () => {
    const post = (body: object) => http.post('/api/users').set(superAdmin).send(body);
    await post(person('B5001', 'RADIO_OPERATOR', { rank: undefined })).expect(400); // rank required
    await post(person('B5001', 'ADMIN', { rank: undefined })).expect(400); // admins need one too
    await post(person('B5001', 'RADIO_OPERATOR', { rank: 'CAPTAIN' })).expect(400);
    await post(person('B5001', 'RADIO_OPERATOR', { firstName: ' ' })).expect(400);
    await post(person('B5001', 'RADIO_OPERATOR', { lastName: undefined })).expect(400);
    for (const bad of ['13084', 'B12', 'BFPX1234', 'B-13084', 'B123456789']) await post(person(bad, 'RADIO_OPERATOR')).expect(400);

    // Super Admin has no rank, even if one is sent.
    const sa = await post(person('B5002', 'SUPER_ADMIN', { rank: 'FO2' })).expect(201);
    expect(sa.body.user.rank).toBeNull();

    // Lowercase is stored uppercase; duplicates are rejected either way.
    const created = await post(person('b5003', 'RADIO_OPERATOR', { rank: 'SFO2', firstName: 'Juan', middleName: 'Santos', lastName: 'Dela Cruz' })).expect(201);
    expect(created.body.user).toMatchObject({ accountNumber: 'B5003', rank: 'SFO2', firstName: 'Juan', middleName: 'Santos', lastName: 'Dela Cruz' });
    const dup = await post(person('B5003', 'RADIO_OPERATOR')).expect(409);
    expect(dup.body.message).toBe('Account number is already registered');

    // Signs in with the account number in any case; the old username field is gone.
    await signIn(app, 'b5003', created.body.temporaryPassword);
    await http.post('/api/auth/login').send({ username: 'B5003', password: 'Changed-pass-1' }).expect(400);

    // Admin can change the account number; the new one signs in, the old one doesn't.
    const id = created.body.user.id;
    await http.patch(`/api/users/${id}`).set(superAdmin).send({ accountNumber: 'SUPERADMIN' }).expect(400); // must match the format
    await http.patch(`/api/users/${id}`).set(superAdmin).send({ accountNumber: 'B5002' }).expect(409);
    await http.patch(`/api/users/${id}`).set(superAdmin).send({ accountNumber: 'B5004' }).expect(200);
    await http.post('/api/auth/login').send({ accountNumber: 'B5004', password: 'Changed-pass-1' }).expect(200);
    await http.post('/api/auth/login').send({ accountNumber: 'B5003', password: 'Changed-pass-1' }).expect(401);
    await http.patch(`/api/users/${id}`).set(superAdmin).send({ role: 'OPERATIONS', officeLevel: 'DISTRICT', districtId: 2, rank: null }).expect(400); // rank can't be removed
  });

  it('accepts its own tokens across small clock steps, but not large ones', async () => {
    const me = (await http.get('/api/auth/me').set(superAdmin).expect(200)).body;
    // A token as the app signs it, on a clock shifted by `offsetMs` (what a WSL/VM time correction looks like).
    const signedAt = (offsetMs: number) => {
      const signer = new JwtSigner({ key: process.env.JWT_SECRET!, issuer: 'bfp-ncr-rcs', audience: 'rcs-web', ttl: '15m', now: () => Date.now() + offsetMs });
      return { Authorization: `Bearer ${signer.sign({ sub: me.id })}` };
    };
    await http.get('/api/auth/me').set(signedAt(10_000)).expect(200); // "issued" 10 s in the future
    await http.get('/api/auth/me').set(signedAt(-15 * 60_000 - 10_000)).expect(200); // expired 10 s ago
    await http.get('/api/auth/me').set(signedAt(120_000)).expect(401);
    await http.get('/api/auth/me').set(signedAt(-15 * 60_000 - 90_000)).expect(401);
  });

  it('nobody can disable or remove themselves', async () => {
    const me = await http.get('/api/auth/me').set(superAdmin).expect(200);
    await http.patch(`/api/users/${me.body.id}`).set(superAdmin).send({ isActive: false }).expect(400);
    await http.delete(`/api/users/${me.body.id}`).set(superAdmin).expect(400);
  });
});
