import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { cityId, createApp, makeUser, superAdminAuth } from './helpers.js';

describe('stations and trucks', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let superAdmin: Record<string, string>;
  let ops2: Record<string, string>; // Operations, Fire District 2 office
  let opsCaloocan: Record<string, string>; // Operations, Caloocan city office
  let radio: Record<string, string>;
  let caloocan: number, malabon: number, pasay: number;

  beforeAll(async () => {
    app = await createApp();
    http = request(app.getHttpServer());
    superAdmin = await superAdminAuth(app);
    [caloocan, malabon, pasay] = await Promise.all(['Caloocan', 'Malabon', 'Pasay'].map((n) => cityId(app, superAdmin, n)));
    ops2 = await makeUser(app, superAdmin, 'S4001', 'OPERATIONS', { officeLevel: 'DISTRICT', districtId: 2 });
    opsCaloocan = await makeUser(app, superAdmin, 'S4002', 'OPERATIONS', { officeLevel: 'CITY', cityId: caloocan });
    radio = await makeUser(app, superAdmin, 'S4003', 'RADIO_OPERATOR');
  });
  afterAll(() => app.close());

  it('lets everyone read stations, filtered by district or city', async () => {
    const all = await http.get('/api/stations').set(radio).expect(200);
    const d2 = await http.get('/api/stations?districtId=2').set(radio).expect(200);
    const cal = await http.get(`/api/stations?cityId=${caloocan}`).set(radio).expect(200);
    expect(all.body.length).toBeGreaterThan(d2.body.length);
    expect(d2.body.length).toBeGreaterThan(cal.body.length);
    expect(d2.body.every((s: { districtId: number }) => s.districtId === 2)).toBe(true);
    expect(cal.body.every((s: { cityId: number }) => s.cityId === caloocan)).toBe(true);
  });

  it('a district Operations office edits any city in its district', async () => {
    const created = await http.post('/api/stations').set(ops2).send({ name: 'Malabon Test FSS', lat: 14.66, lng: 120.95, cityId: malabon }).expect(201);
    expect(created.body.districtId).toBe(2); // district follows the city
    await http.post('/api/stations').set(ops2).send({ name: 'Other', lat: 14.54, lng: 121, cityId: pasay }).expect(403);
    await http.patch(`/api/stations/${created.body.id}`).set(ops2).send({ cityId: pasay }).expect(403); // can't move it out of the district

    const d1Station = (await http.get('/api/stations?districtId=1').set(ops2)).body[0];
    await http.patch(`/api/stations/${d1Station.id}`).set(ops2).send({ name: 'Hijack' }).expect(403);
    await http.patch(`/api/trucks/${d1Station.trucks[0].id}`).set(ops2).send({ status: 'OUT_OF_SERVICE' }).expect(403);

    const truck = await http
      .post(`/api/stations/${created.body.id}/trucks`)
      .set(ops2)
      .send({ callSign: 'Malabon E-1', type: 'ENGINE', ownership: 'BFP', waterCapacityLiters: 2000 })
      .expect(201);
    expect(truck.body.status).toBe('AVAILABLE');
    await http.patch(`/api/trucks/${truck.body.id}`).set(ops2).send({ status: 'OUT_OF_SERVICE' }).expect(200);

    // Ambulance and Rescue units can't be added or set any more; fire truck types still can.
    for (const type of ['AMBULANCE', 'RESCUE']) {
      await http.post(`/api/stations/${created.body.id}/trucks`).set(ops2).send({ callSign: `X ${type}`, type, ownership: 'BFP' }).expect(400);
      await http.patch(`/api/trucks/${truck.body.id}`).set(ops2).send({ type }).expect(400);
    }
    for (const type of ['TANKER', 'AERIAL_LADDER', 'OTHER']) await http.patch(`/api/trucks/${truck.body.id}`).set(ops2).send({ type }).expect(200);
    await http.delete(`/api/trucks/${truck.body.id}`).set(ops2).expect(204);
    const after = (await http.get(`/api/stations?cityId=${malabon}`).set(ops2)).body.find((s: { id: number }) => s.id === created.body.id);
    expect(after.trucks).toHaveLength(0);
  });

  it('a city Operations office edits only its own city', async () => {
    const own = await http.post('/api/stations').set(opsCaloocan).send({ name: 'Caloocan Test FSS', lat: 14.65, lng: 120.98, cityId: caloocan }).expect(201);
    await http.post(`/api/stations/${own.body.id}/trucks`).set(opsCaloocan).send({ callSign: 'Cal E-9', type: 'ENGINE', ownership: 'BFP' }).expect(201);
    // Malabon is in the same district, but not this office's city.
    await http.post('/api/stations').set(opsCaloocan).send({ name: 'X', lat: 14.66, lng: 120.95, cityId: malabon }).expect(403);
    const malabonStation = (await http.get(`/api/stations?cityId=${malabon}`).set(opsCaloocan)).body[0];
    await http.patch(`/api/stations/${malabonStation.id}`).set(opsCaloocan).send({ name: 'Hijack' }).expect(403);
  });

  it('does not let radio operators edit', async () => {
    await http.post('/api/stations').set(radio).send({ name: 'X', lat: 14.65, lng: 120.98, cityId: caloocan }).expect(403);
  });

  it('super admin edits any city', async () => {
    const d4Station = (await http.get('/api/stations?districtId=4').set(superAdmin)).body[0];
    await http.patch(`/api/stations/${d4Station.id}`).set(superAdmin).send({ contactNumber: '(02) 8123-4567' }).expect(200);
  });
});
