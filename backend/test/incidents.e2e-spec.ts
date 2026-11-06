import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp, makeUser, superAdminAuth } from './helpers.js';

const SAMPALOC = { lat: 14.6079, lng: 120.995 };

type Unit = { stationId: number; truckId: number; alarmLevel: string; releasedAt: string | null; truck: { status: string } };

describe('incidents: dispatch, raise alarm, close', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let superAdmin: Record<string, string>;
  let radio: Record<string, string>;

  beforeAll(async () => {
    app = await createApp();
    http = request(app.getHttpServer());
    superAdmin = await superAdminAuth(app);
    radio = await makeUser(app, superAdmin, 'inc-radio', 'RADIO_OPERATOR');
  });
  afterAll(() => app.close());

  const truckStatus = async (stationId: number, truckId: number) => {
    const stations = (await http.get('/api/stations').set(radio)).body;
    return stations.find((s: { id: number }) => s.id === stationId).trucks.find((t: { id: number }) => t.id === truckId).status;
  };

  it('runs the whole incident lifecycle', async () => {
    // A second truck at the nearest station lets us check the operator's pick is honoured.
    const card = (await http.get('/api/running-card').query(SAMPALOC).set(radio)).body;
    const nearest = card[0].stations[0];
    const extra = await http
      .post(`/api/stations/${nearest.id}/trucks`)
      .set(superAdmin)
      .send({ callSign: 'Second Engine', type: 'TANKER', ownership: 'BFP' })
      .expect(201);

    const created = await http
      .post('/api/incidents')
      .set(radio)
      .send({ ...SAMPALOC, locationLabel: 'Test fire, Sampaloc', truckPicks: { [nearest.id]: extra.body.id } })
      .expect(201);
    const incident = created.body;
    expect(incident.status).toBe('OPEN');
    expect(incident.alarmLevel).toBe('1st Alarm');
    expect(incident.units).toHaveLength(4);
    expect(incident.units.every((u: Unit) => u.truck.status === 'RESPONDING')).toBe(true);
    expect(incident.units.find((u: Unit) => u.stationId === nearest.id).truckId).toBe(extra.body.id);

    // Responding trucks leave the live card; the nearest station still has its first truck, so it stays.
    const after = (await http.get('/api/running-card').query(SAMPALOC).set(radio)).body;
    const nearestAfter = after.flatMap((a: { stations: { id: number; trucks: { id: number }[] }[] }) => a.stations).find((s: { id: number }) => s.id === nearest.id);
    expect(nearestAfter.trucks.map((t: { id: number }) => t.id)).not.toContain(extra.body.id);

    // Next alarm skips stations already on the incident.
    const next = (await http.get(`/api/incidents/${incident.id}/next-alarm`).set(radio).expect(200)).body;
    expect(next.alarmLevel).toBe('2nd Alarm');
    const onIncident = incident.units.map((u: Unit) => u.stationId);
    expect(next.stations.some((s: { id: number }) => onIncident.includes(s.id))).toBe(false);

    const raised = (await http.post(`/api/incidents/${incident.id}/raise`).set(radio).send({}).expect(200)).body;
    expect(raised.alarmLevel).toBe('2nd Alarm');
    expect(raised.units).toHaveLength(8);
    expect(raised.units.filter((u: Unit) => u.alarmLevel === '2nd Alarm')).toHaveLength(4);

    // Operations takes one responding truck out of service; closing must not put it back to available.
    const broken = raised.units[1];
    await http.patch(`/api/trucks/${broken.truckId}`).set(superAdmin).send({ status: 'OUT_OF_SERVICE' }).expect(200);

    const closed = (await http.post(`/api/incidents/${incident.id}/close`).set(radio).expect(200)).body;
    expect(closed.status).toBe('CLOSED');
    expect(closed.closedBy.username).toBe('inc-radio');
    expect(closed.units.every((u: Unit) => u.releasedAt)).toBe(true);
    expect(await truckStatus(broken.stationId, broken.truckId)).toBe('OUT_OF_SERVICE');
    expect(await truckStatus(raised.units[0].stationId, raised.units[0].truckId)).toBe('AVAILABLE');

    await http.post(`/api/incidents/${incident.id}/raise`).set(radio).send({}).expect(400);
    await http.post(`/api/incidents/${incident.id}/close`).set(radio).expect(400);

    const open = (await http.get('/api/incidents?status=OPEN').set(radio)).body;
    expect(open.map((i: { id: string }) => i.id)).not.toContain(incident.id);
  });

  it('shows Operations only incidents their district responded to', async () => {
    const created = (await http.post('/api/incidents').set(radio).send({ ...SAMPALOC, locationLabel: 'Manila fire' }).expect(201)).body;
    const ops5 = await makeUser(app, superAdmin, 'inc-ops5', 'OPERATIONS', 5); // Quezon City, far from Sampaloc's 1st alarm
    const districts = created.units.map((u: { station: { districtId: number } }) => u.station.districtId);
    const visible = (await http.get('/api/incidents').set(ops5)).body.map((i: { id: string }) => i.id).includes(created.id);
    expect(visible).toBe(districts.includes(5));
    if (!districts.includes(5)) await http.get(`/api/incidents/${created.id}`).set(ops5).expect(403);
    await http.post(`/api/incidents/${created.id}/close`).set(radio).expect(200);
  });
});
