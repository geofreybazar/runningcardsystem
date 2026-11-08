import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { cityId, createApp, makeUser, superAdminAuth } from './helpers.js';

const MONUMENTO = { lat: 14.6573, lng: 120.9839 }; // Caloocan (Fire District 2)
const BATASAN = { lat: 14.6923, lng: 121.0965 }; // Quezon City

type CardStation = { id: number; city: { name: string } | null; trucks: { id: number }[] };

describe('special deployments', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let superAdmin: Record<string, string>;
  let regionalOps: Record<string, string>;
  let caloocanOps: Record<string, string>;
  let manilaOps: Record<string, string>;
  let caloocanRadio: Record<string, string>;
  let station: CardStation; // a Caloocan station on the first alarm of a Monumento fire

  const card = async () => (await http.get('/api/running-card').query(MONUMENTO).set(superAdmin).expect(200)).body.alarms as { stations: CardStation[] }[];
  const onCard = async (stationId: number) => (await card()).some((a) => a.stations.some((s) => s.id === stationId));
  const truckStatus = async (truckId: number) => {
    const stations = (await http.get('/api/stations').query({ districtId: 2 }).set(superAdmin)).body;
    return stations.flatMap((s: { trucks: { id: number; status: string }[] }) => s.trucks).find((t: { id: number }) => t.id === truckId).status;
  };
  const create = (auth: Record<string, string>, body: object = {}) =>
    http.post('/api/deployments').set(auth).send({ name: 'SONA 2026', locationLabel: 'Batasang Pambansa', ...BATASAN, startsAt: '2026-07-27T06:00:00Z', ...body });

  beforeAll(async () => {
    app = await createApp();
    http = request(app.getHttpServer());
    superAdmin = await superAdminAuth(app);
    const caloocan = await cityId(app, superAdmin, 'Caloocan');
    regionalOps = await makeUser(app, superAdmin, 'D3001', 'OPERATIONS', { officeLevel: 'REGIONAL' });
    caloocanOps = await makeUser(app, superAdmin, 'D3002', 'OPERATIONS', { officeLevel: 'CITY', cityId: caloocan });
    manilaOps = await makeUser(app, superAdmin, 'D3003', 'OPERATIONS', { officeLevel: 'DISTRICT', districtId: 1 });
    caloocanRadio = await makeUser(app, superAdmin, 'D3004', 'RADIO_OPERATOR', { officeLevel: 'CITY', cityId: caloocan });
    station = (await card())[0].stations.find((s) => s.city?.name === 'Caloocan')!;
    expect(station).toBeDefined();
  });
  afterAll(() => app.close());

  it('only Regional Operations and Super Admin manage deployments; everyone reads them', async () => {
    await create(caloocanOps).expect(403);
    await create(caloocanRadio).expect(403);
    await create(regionalOps, { endsAt: '2026-07-26T00:00:00Z' }).expect(400); // ends before it starts
    const d = (await create(regionalOps).expect(201)).body;
    expect(d).toMatchObject({ name: 'SONA 2026', status: 'ACTIVE', units: [] });
    await http.get(`/api/deployments/${d.id}`).set(caloocanRadio).expect(200);
    expect((await http.get('/api/deployments').query({ status: 'ACTIVE' }).set(manilaOps).expect(200)).body.some((x: { id: string }) => x.id === d.id)).toBe(true);
    await http.post(`/api/deployments/${d.id}/end`).set(superAdmin).expect(200);
  });

  it('deployed trucks leave the running card, stay locked, and come back on release and end', async () => {
    const trucks = station.trucks.map((t) => t.id); // every available truck of the station
    const d = (await create(regionalOps, { truckIds: trucks }).expect(201)).body;
    expect(d.units).toHaveLength(trucks.length);
    expect(await truckStatus(trucks[0])).toBe('DEPLOYED');
    expect(await onCard(station.id)).toBe(false);

    // The station's city can't take it back or retire it, and can't assign it twice.
    await http.patch(`/api/trucks/${trucks[0]}`).set(caloocanOps).send({ status: 'AVAILABLE' }).expect(409);
    await http.delete(`/api/trucks/${trucks[0]}`).set(caloocanOps).expect(409);
    await http.post(`/api/deployments/${d.id}/trucks`).set(regionalOps).send({ truckIds: [trucks[0]] }).expect(409);

    // Only the truck's own city (and Regional) are notified.
    const notes = async (auth: Record<string, string>) =>
      (await http.get('/api/notifications').set(auth).expect(200)).body.filter((n: { deploymentId: string }) => n.deploymentId === d.id);
    expect((await notes(caloocanOps)).map((n: { type: string }) => n.type)).toEqual(['DEPLOYMENT_ASSIGNED']);
    expect(await notes(manilaOps)).toEqual([]);

    // Each truck can be given its own post within the event; the station's city can't move it.
    const post = { postLabel: 'Quiapo Church', lat: 14.5986, lng: 120.9837 };
    await http.patch(`/api/deployments/${d.id}/trucks/${trucks[0]}/post`).set(caloocanOps).send(post).expect(403);
    const posted = (await http.patch(`/api/deployments/${d.id}/trucks/${trucks[0]}/post`).set(regionalOps).send(post).expect(200)).body;
    expect(posted.units.find((u: { truckId: number }) => u.truckId === trucks[0])).toMatchObject({ postLabel: 'Quiapo Church', postLat: 14.5986, postLng: 120.9837 });

    await http.post(`/api/deployments/${d.id}/trucks/${trucks[0]}/release`).set(regionalOps).expect(200);
    expect(await truckStatus(trucks[0])).toBe('AVAILABLE');
    expect(await onCard(station.id)).toBe(true);

    if (trucks.length > 1) {
      await http.post(`/api/deployments/${d.id}/trucks`).set(regionalOps).send({ truckIds: [trucks[0]] }).expect(200);
    }
    const ended = (await http.post(`/api/deployments/${d.id}/end`).set(regionalOps).expect(200)).body;
    expect(ended.status).toBe('ENDED');
    expect(ended.units.every((u: { releasedAt: string | null }) => u.releasedAt)).toBe(true);
    for (const t of trucks) expect(await truckStatus(t)).toBe('AVAILABLE');
    await http.post(`/api/deployments/${d.id}/trucks`).set(regionalOps).send({ truckIds: [trucks[0]] }).expect(400); // ended
    expect((await notes(caloocanOps)).map((n: { type: string }) => n.type).sort()).toContain('DEPLOYMENT_RELEASED');
  });

  it('a truck responding to a fire cannot be deployed', async () => {
    const fire = (await http.post('/api/incidents').set(caloocanRadio).send({ ...MONUMENTO, locationLabel: 'Test fire' }).expect(201)).body;
    const busy = fire.units[0].truckId;
    await create(regionalOps, { truckIds: [busy] }).expect(409);
    await http.post(`/api/incidents/${fire.id}/close`).set(caloocanRadio).expect(200);
  });

  it('deleting a deployment releases its trucks and hides it everywhere', async () => {
    const trucks = station.trucks.map((t) => t.id);
    const d = (await create(regionalOps, { name: 'Mistake', truckIds: trucks }).expect(201)).body;
    await http.delete(`/api/deployments/${d.id}`).set(caloocanOps).expect(403);
    await http.delete(`/api/deployments/${d.id}`).set(regionalOps).expect(204);
    for (const t of trucks) expect(await truckStatus(t)).toBe('AVAILABLE');
    expect(await onCard(station.id)).toBe(true);
    await http.get(`/api/deployments/${d.id}`).set(regionalOps).expect(404);
    const listed = (await http.get('/api/deployments').set(regionalOps).expect(200)).body;
    expect(listed.some((x: { id: string }) => x.id === d.id)).toBe(false);
    await http.delete(`/api/deployments/${d.id}`).set(regionalOps).expect(404);
    await http.post(`/api/deployments/${d.id}/trucks`).set(regionalOps).send({ truckIds: trucks }).expect(404);
  });
});
