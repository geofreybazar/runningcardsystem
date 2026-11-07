import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { cityId, createApp, makeUser, person, refreshCookie, superAdminAuth } from './helpers.js';

const MONUMENTO = { lat: 14.6573, lng: 120.9839 }; // Caloocan

type Entry = { action: string; entity: string; entityId: string; userId: string | null; ip: string | null; changes: Record<string, unknown> | null };

describe('audit log covers sign-ins, incidents and pins', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let superAdmin: Record<string, string>;

  beforeAll(async () => {
    app = await createApp();
    http = request(app.getHttpServer());
    superAdmin = await superAdminAuth(app);
  });
  afterAll(() => app.close());

  const entries = async (entity: string): Promise<Entry[]> => (await http.get(`/api/audit-logs?entity=${entity}&take=500`).set(superAdmin).expect(200)).body;

  it('records sign-ins, failures with their reason, password changes, sign-outs and token reuse', async () => {
    const created = await http.post('/api/users').set(superAdmin).send(person('U7001', 'RADIO_OPERATOR')).expect(201);
    const id = created.body.user.id;
    await http.post('/api/auth/login').send({ accountNumber: 'U7001', password: 'wrong-pass' }).expect(401);
    await http.post('/api/auth/login').send({ accountNumber: 'U7999', password: 'wrong-pass' }).expect(401);
    const login = await http.post('/api/auth/login').send({ accountNumber: 'U7001', password: created.body.temporaryPassword }).expect(200);
    const token = { Authorization: `Bearer ${login.body.accessToken}` };
    await http.post('/api/auth/change-password').set(token).send({ currentPassword: created.body.temporaryPassword, newPassword: 'Audit-pass-1' }).expect(200);

    const signedIn = await http.post('/api/auth/login').send({ accountNumber: 'U7001', password: 'Audit-pass-1' }).expect(200);
    const first = refreshCookie(signedIn)!;
    const rotated = refreshCookie(await http.post('/api/auth/refresh').set('Cookie', first).expect(200))!;
    await http.post('/api/auth/refresh').set('Cookie', first).expect(401); // reuse: possible theft
    const again = await http.post('/api/auth/login').send({ accountNumber: 'U7001', password: 'Audit-pass-1' }).expect(200);
    await http.post('/api/auth/logout').set('Cookie', refreshCookie(again)!).expect(204);
    expect(rotated).toBeDefined();

    const sessions = await entries('Session');
    const mine = sessions.filter((e) => e.userId === id);
    const reasons = sessions.filter((e) => e.action === 'SIGN_IN_FAILED').map((e) => e.changes?.reason);
    expect(reasons).toEqual(expect.arrayContaining(['wrong password', 'unknown account number']));
    const unknown = sessions.find((e) => e.action === 'SIGN_IN_FAILED' && e.changes?.accountNumber === 'U7999')!;
    expect(unknown).toMatchObject({ userId: null, entityId: 'U7999' });
    expect(unknown.ip).toBeTruthy(); // the client address is recorded
    expect(mine.map((e) => e.action)).toEqual(expect.arrayContaining(['SIGN_IN', 'SIGN_IN_FAILED', 'TOKEN_REUSED', 'SIGN_OUT']));
    expect((await entries('User')).some((e) => e.action === 'CHANGE_PASSWORD' && e.entityId === id)).toBe(true);
  });

  it('records dispatch, raise alarm and close with the trucks involved', async () => {
    const caloocan = await cityId(app, superAdmin, 'Caloocan');
    const radio = await makeUser(app, superAdmin, 'U7002', 'RADIO_OPERATOR', { officeLevel: 'CITY', cityId: caloocan });
    const fire = (await http.post('/api/incidents').set(radio).send({ ...MONUMENTO, locationLabel: 'Audit fire' }).expect(201)).body;
    const raised = (await http.post(`/api/incidents/${fire.id}/raise`).set(radio).send({}).expect(200)).body;
    await http.post(`/api/incidents/${fire.id}/close`).set(radio).expect(200);

    const log = (await entries('Incident')).filter((e) => e.entityId === fire.id);
    expect(log.map((e) => e.action).sort()).toEqual(['CLOSE', 'DISPATCH', 'RAISE_ALARM']);
    const dispatch = log.find((e) => e.action === 'DISPATCH')!;
    expect(dispatch.changes).toMatchObject({ locationLabel: 'Audit fire', city: 'Caloocan', alarmLevel: '1st Alarm' });
    expect((dispatch.changes!.trucks as string[]).length).toBe(fire.units.length);
    expect((log.find((e) => e.action === 'CLOSE')!.changes!.released as string[]).length).toBe(raised.units.length);
  });

  it('records the first barangay pin as well as corrections', async () => {
    const malabon = await cityId(app, superAdmin, 'Malabon');
    const barangays = (await http.get(`/api/cities/${malabon}/barangays`).set(superAdmin).expect(200)).body as { id: number; lat: number | null }[];
    const unpinned = barangays.find((b) => b.lat === null)!;
    await http.put(`/api/barangays/${unpinned.id}/location`).set(superAdmin).send({ lat: 14.66, lng: 120.95 }).expect(200);
    await http.put(`/api/barangays/${unpinned.id}/location`).set(superAdmin).send({ lat: 14.661, lng: 120.951 }).expect(200);
    const pins = (await entries('Barangay')).filter((e) => e.entityId === String(unpinned.id)).map((e) => e.action);
    expect(pins.sort()).toEqual(['SET_PIN', 'UPDATE']);
  });
});
