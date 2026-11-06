import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp, makeUser, superAdminAuth } from './helpers.js';

describe('stations and trucks', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let superAdmin: Record<string, string>;
  let ops2: Record<string, string>; // Operations, Fire District 2
  let radio: Record<string, string>;

  beforeAll(async () => {
    app = await createApp();
    http = request(app.getHttpServer());
    superAdmin = await superAdminAuth(app);
    ops2 = await makeUser(app, superAdmin, 'st-ops2', 'OPERATIONS', 2);
    radio = await makeUser(app, superAdmin, 'st-radio', 'RADIO_OPERATOR');
  });
  afterAll(() => app.close());

  it('lets everyone read stations, filtered by district', async () => {
    const all = await http.get('/api/stations').set(radio).expect(200);
    const d2 = await http.get('/api/stations?districtId=2').set(radio).expect(200);
    expect(all.body.length).toBeGreaterThan(d2.body.length);
    expect(d2.body.every((s: { districtId: number }) => s.districtId === 2)).toBe(true);
  });

  it('limits Operations to their own district', async () => {
    const caloocan = (await http.get('/api/districts').set(ops2)).body.find((d: { code: number }) => d.code === 2).cities[0];
    const created = await http
      .post('/api/stations')
      .set(ops2)
      .send({ name: 'Test FSS', lat: 14.65, lng: 120.98, districtId: 2, cityId: caloocan.id })
      .expect(201);
    await http.post('/api/stations').set(ops2).send({ name: 'Other', lat: 14.6, lng: 121, districtId: 3 }).expect(403);
    await http.patch(`/api/stations/${created.body.id}`).set(ops2).send({ districtId: 3 }).expect(403);
    // A city from another district is rejected.
    await http.patch(`/api/stations/${created.body.id}`).set(ops2).send({ cityId: 1 }).expect(400);

    const d1Station = (await http.get('/api/stations?districtId=1').set(ops2)).body[0];
    await http.patch(`/api/stations/${d1Station.id}`).set(ops2).send({ name: 'Hijack' }).expect(403);
    await http.patch(`/api/trucks/${d1Station.trucks[0].id}`).set(ops2).send({ status: 'OUT_OF_SERVICE' }).expect(403);

    const truck = await http
      .post(`/api/stations/${created.body.id}/trucks`)
      .set(ops2)
      .send({ callSign: 'Caloocan E-1', type: 'ENGINE', ownership: 'BFP', waterCapacityLiters: 2000 })
      .expect(201);
    expect(truck.body.status).toBe('AVAILABLE');
    await http.patch(`/api/trucks/${truck.body.id}`).set(ops2).send({ status: 'OUT_OF_SERVICE' }).expect(200);
    await http.delete(`/api/trucks/${truck.body.id}`).set(ops2).expect(204);
    const after = (await http.get('/api/stations?districtId=2').set(ops2)).body.find((s: { id: number }) => s.id === created.body.id);
    expect(after.trucks).toHaveLength(0);
  });

  it('does not let radio operators edit', async () => {
    await http.post('/api/stations').set(radio).send({ name: 'X', lat: 14.6, lng: 121, districtId: 2 }).expect(403);
  });

  it('super admin edits any district', async () => {
    const d4Station = (await http.get('/api/stations?districtId=4').set(superAdmin)).body[0];
    await http.patch(`/api/stations/${d4Station.id}`).set(superAdmin).send({ contactNumber: '(02) 8123-4567' }).expect(200);
  });
});
