import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp, makeUser, superAdminAuth } from './helpers.js';

const QUIAPO = { lat: 14.5986, lng: 120.9836 };

describe('running card and barangay pins', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let superAdmin: Record<string, string>;
  let radio: Record<string, string>;
  let ops2: Record<string, string>; // Fire District 2 Operations: view only
  let opsCaloocan: Record<string, string>;

  beforeAll(async () => {
    app = await createApp();
    http = request(app.getHttpServer());
    superAdmin = await superAdminAuth(app);
    radio = await makeUser(app, superAdmin, 'R3001', 'RADIO_OPERATOR');
    ops2 = await makeUser(app, superAdmin, 'R3002', 'OPERATIONS', { officeLevel: 'DISTRICT', districtId: 2 });
    const caloocanId = (await http.get('/api/districts').set(radio)).body.flatMap((d: { cities: { id: number; name: string }[] }) => d.cities).find((c: { name: string }) => c.name === 'Caloocan').id;
    opsCaloocan = await makeUser(app, superAdmin, 'R3004', 'OPERATIONS', { officeLevel: 'CITY', cityId: caloocanId });
  });
  afterAll(() => app.close());

  const card = async () => (await http.get('/api/running-card').query(QUIAPO).set(radio).expect(200)).body.alarms;

  it('lists nearest stations with their available trucks, 4 per alarm', async () => {
    const alarms = await card();
    expect(alarms[0].alarmLevel).toBe('1st Alarm');
    expect(alarms[0].stations).toHaveLength(4);
    const all = alarms.flatMap((a: { stations: { distance: number }[] }) => a.stations);
    expect(all.every((s: { distance: number }, i: number) => i === 0 || all[i - 1].distance <= s.distance)).toBe(true);
    expect(alarms[0].stations[0].trucks.length).toBeGreaterThan(0);
    // No OSRM_URL in tests: every distance is the straight-line fallback, flagged as such.
    expect(all.every((s: { byRoad: boolean }) => s.byRoad === false)).toBe(true);
  });

  it('skips a station whose trucks are all unavailable', async () => {
    const nearest = (await card())[0].stations[0];
    for (const t of nearest.trucks) {
      await http.patch(`/api/trucks/${t.id}`).set(superAdmin).send({ status: 'OUT_OF_SERVICE' }).expect(200);
    }
    const ids = (await card()).flatMap((a: { stations: { id: number }[] }) => a.stations.map((s) => s.id));
    expect(ids).not.toContain(nearest.id);
    for (const t of nearest.trucks) {
      await http.patch(`/api/trucks/${t.id}`).set(superAdmin).send({ status: 'AVAILABLE' }).expect(200);
    }
  });

  it("says which city the location is in, or null outside NCR", async () => {
    const quiapo = (await http.get('/api/running-card').query(QUIAPO).set(radio).expect(200)).body;
    expect(quiapo.city.name).toBe('Manila');
    const cavite = (await http.get('/api/running-card').query({ lat: 14.2956, lng: 120.9583 }).set(radio).expect(200)).body;
    expect(cavite.city).toBeNull();
  });

  it('rejects bad coordinates', async () => {
    await http.get('/api/running-card').query({ lat: 'x', lng: 121 }).set(radio).expect(400);
    await http.get('/api/running-card').query(QUIAPO).set(ops2).expect(403); // only radio operators and super admin use the card
  });

  it('lets anyone set a first barangay pin, but only the Operations office running that city correct it', async () => {
    const districts = (await http.get('/api/districts').set(radio)).body;
    const caloocan = districts.find((d: { code: number }) => d.code === 2).cities.find((c: { name: string }) => c.name === 'Caloocan');
    const manila = districts.find((d: { code: number }) => d.code === 1).cities[0];
    const [bCaloocan] = (await http.get(`/api/cities/${caloocan.id}/barangays`).set(radio)).body;
    const [bManila] = (await http.get(`/api/cities/${manila.id}/barangays`).set(radio)).body;

    await http.put(`/api/barangays/${bCaloocan.id}/location`).set(radio).send({ lat: 14.65, lng: 120.97 }).expect(200);
    await http.put(`/api/barangays/${bCaloocan.id}/location`).set(radio).send({ lat: 14.66, lng: 120.97 }).expect(403);
    await http.put(`/api/barangays/${bCaloocan.id}/location`).set(ops2).send({ lat: 14.66, lng: 120.97 }).expect(403); // FD II only views
    await http.put(`/api/barangays/${bCaloocan.id}/location`).set(opsCaloocan).send({ lat: 14.66, lng: 120.97 }).expect(200);

    await http.put(`/api/barangays/${bManila.id}/location`).set(radio).send({ lat: 14.6, lng: 120.98 }).expect(200);
    await http.put(`/api/barangays/${bManila.id}/location`).set(opsCaloocan).send({ lat: 14.61, lng: 120.98 }).expect(403);
  });
});

describe('settings', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let superAdmin: Record<string, string>;

  beforeAll(async () => {
    app = await createApp();
    http = request(app.getHttpServer());
    superAdmin = await superAdminAuth(app);
  });
  afterAll(() => app.close());

  it('only super admin changes the running card rules, and the card follows them', async () => {
    const admin = await makeUser(app, superAdmin, 'R3003', 'ADMIN');
    const original = (await http.get('/api/settings').set(admin).expect(200)).body;
    await http.put('/api/settings').set(admin).send({ ...original, id: undefined }).expect(403);

    const rules = { stationsPerAlarm: 3, maxDistanceKm: 100, alarmLevels: ['First', 'Second'] };
    await http.put('/api/settings').set(superAdmin).send({ ...rules, alarmLevels: ['A', 'A'] }).expect(400);
    await http.put('/api/settings').set(superAdmin).send(rules).expect(200);
    const card = (await http.get('/api/running-card').query(QUIAPO).set(superAdmin)).body.alarms;
    expect(card.map((a: { alarmLevel: string }) => a.alarmLevel)).toEqual(['First', 'Second']);
    expect(card[0].stations).toHaveLength(3);

    const { stationsPerAlarm, maxDistanceKm, alarmLevels } = original;
    await http.put('/api/settings').set(superAdmin).send({ stationsPerAlarm, maxDistanceKm, alarmLevels }).expect(200);
  });
});
