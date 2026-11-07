import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { cityId, createApp, makeUser, superAdminAuth } from './helpers.js';

const SAMPALOC = { lat: 14.6079, lng: 120.995 }; // Manila (Fire District 1)
const MONUMENTO = { lat: 14.6573, lng: 120.9839 }; // Caloocan (Fire District 2)
const TAFT = { lat: 14.5649, lng: 120.9934 }; // Malate, Manila

type Unit = { stationId: number; truckId: number; alarmLevel: string; releasedAt: string | null; truck: { status: string } };

describe('incidents: dispatch, raise alarm, close', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let superAdmin: Record<string, string>;
  let manilaRadio: Record<string, string>; // FD1 district office: dispatches Manila
  let caloocanRadio: Record<string, string>; // Caloocan city office
  let fd2Radio: Record<string, string>; // FD2 district office: view only
  let regionalRadio: Record<string, string>; // view only
  let manilaOps: Record<string, string>;
  let admin: Record<string, string>;

  beforeAll(async () => {
    app = await createApp();
    http = request(app.getHttpServer());
    superAdmin = await superAdminAuth(app);
    const caloocan = await cityId(app, superAdmin, 'Caloocan');
    manilaRadio = await makeUser(app, superAdmin, 'I2001', 'RADIO_OPERATOR', { officeLevel: 'DISTRICT', districtId: 1 });
    caloocanRadio = await makeUser(app, superAdmin, 'I2002', 'RADIO_OPERATOR', { officeLevel: 'CITY', cityId: caloocan });
    fd2Radio = await makeUser(app, superAdmin, 'I2003', 'RADIO_OPERATOR', { officeLevel: 'DISTRICT', districtId: 2 });
    regionalRadio = await makeUser(app, superAdmin, 'I2004', 'RADIO_OPERATOR');
    manilaOps = await makeUser(app, superAdmin, 'I2005', 'OPERATIONS', { officeLevel: 'DISTRICT', districtId: 1 });
    admin = await makeUser(app, superAdmin, 'I2006', 'ADMIN');
  });
  afterAll(() => app.close());

  const dispatch = (auth: Record<string, string>, where: { lat: number; lng: number }, body: object = {}) =>
    http.post('/api/incidents').set(auth).send({ ...where, locationLabel: 'Test fire', ...body });
  const truckStatus = async (stationId: number, truckId: number) => {
    const stations = (await http.get('/api/stations').set(superAdmin)).body;
    return stations.find((s: { id: number }) => s.id === stationId).trucks.find((t: { id: number }) => t.id === truckId).status;
  };

  it('only the dispatchers of the fire’s city (and super admin) may dispatch', async () => {
    await dispatch(caloocanRadio, SAMPALOC).expect(403); // Manila fire, Caloocan office
    await dispatch(fd2Radio, MONUMENTO).expect(403); // district 2 office only watches
    await dispatch(regionalRadio, SAMPALOC).expect(403);
    await dispatch(manilaOps, SAMPALOC).expect(403);
    await dispatch(admin, SAMPALOC).expect(403);
    await dispatch(manilaRadio, { lat: 14.2956, lng: 120.9583 }).expect(400); // Cavite: outside NCR

    const cal = (await dispatch(caloocanRadio, MONUMENTO).expect(201)).body;
    expect(cal.city.name).toBe('Caloocan');
    await http.post(`/api/incidents/${cal.id}/raise`).set(manilaRadio).send({}).expect(403); // not their city
    await http.post(`/api/incidents/${cal.id}/close`).set(caloocanRadio).expect(200);

    const any = (await dispatch(superAdmin, MONUMENTO).expect(201)).body;
    await http.post(`/api/incidents/${any.id}/close`).set(superAdmin).expect(200);
  });

  it('runs the whole incident lifecycle', async () => {
    // A second truck at the nearest station lets us check the operator's pick is honoured.
    const card = (await http.get('/api/running-card').query(SAMPALOC).set(manilaRadio)).body.alarms;
    const nearest = card[0].stations[0];
    const extra = await http
      .post(`/api/stations/${nearest.id}/trucks`)
      .set(superAdmin)
      .send({ callSign: 'Second Engine', type: 'TANKER', ownership: 'BFP' })
      .expect(201);

    const incident = (await dispatch(manilaRadio, SAMPALOC, { truckPicks: { [nearest.id]: extra.body.id } }).expect(201)).body;
    expect(incident.status).toBe('OPEN');
    expect(incident.alarmLevel).toBe('1st Alarm');
    expect(incident.units).toHaveLength(4);
    expect(incident.units.every((u: Unit) => u.truck.status === 'RESPONDING')).toBe(true);
    expect(incident.units.find((u: Unit) => u.stationId === nearest.id).truckId).toBe(extra.body.id);

    // Next alarm skips stations already on the incident.
    const next = (await http.get(`/api/incidents/${incident.id}/next-alarm`).set(manilaRadio).expect(200)).body;
    await http.get(`/api/incidents/${incident.id}/next-alarm`).set(caloocanRadio).expect(403); // only the fire city's dispatchers preview it
    expect(next.alarmLevel).toBe('2nd Alarm');
    const onIncident = incident.units.map((u: Unit) => u.stationId);
    expect(next.stations.some((s: { id: number }) => onIncident.includes(s.id))).toBe(false);

    const raised = (await http.post(`/api/incidents/${incident.id}/raise`).set(manilaRadio).send({}).expect(200)).body;
    expect(raised.alarmLevel).toBe('2nd Alarm');
    expect(raised.units).toHaveLength(8);

    // Operations takes one responding truck out of service; closing must not put it back to available.
    const broken = raised.units[1];
    await http.patch(`/api/trucks/${broken.truckId}`).set(superAdmin).send({ status: 'OUT_OF_SERVICE' }).expect(200);

    const closed = (await http.post(`/api/incidents/${incident.id}/close`).set(manilaRadio).expect(200)).body;
    expect(closed.status).toBe('CLOSED');
    expect(closed.units.every((u: Unit) => u.releasedAt)).toBe(true);
    expect(await truckStatus(broken.stationId, broken.truckId)).toBe('OUT_OF_SERVICE');
    expect(await truckStatus(raised.units[0].stationId, raised.units[0].truckId)).toBe('AVAILABLE');
    await http.patch(`/api/trucks/${broken.truckId}`).set(superAdmin).send({ status: 'AVAILABLE' }).expect(200);

    await http.post(`/api/incidents/${incident.id}/raise`).set(manilaRadio).send({}).expect(400);
    await http.post(`/api/incidents/${incident.id}/close`).set(manilaRadio).expect(400);
  });

  it('never sends a truck that is already on another incident', async () => {
    const nearest = (await http.get('/api/running-card').query(TAFT).set(manilaRadio)).body.alarms[0].stations[0];
    const second = (
      await http.post(`/api/stations/${nearest.id}/trucks`).set(superAdmin).send({ callSign: 'Taft Second', type: 'ENGINE', ownership: 'BFP' }).expect(201)
    ).body;

    const unitAt = (inc: { units: Unit[] }) => inc.units.find((u) => u.stationId === nearest.id);
    const a = (await dispatch(manilaRadio, TAFT).expect(201)).body;
    const b = (await dispatch(manilaRadio, TAFT).expect(201)).body;
    const c = (await dispatch(manilaRadio, TAFT).expect(201)).body;

    // A and B both use the station, each with a different truck; C finds it empty and moves on to the next nearest.
    expect(unitAt(a)).toBeDefined();
    expect(unitAt(b)).toBeDefined();
    expect(unitAt(a)!.truckId).not.toBe(unitAt(b)!.truckId);
    expect([unitAt(a)!.truckId, unitAt(b)!.truckId]).toContain(second.id);
    expect(unitAt(c)).toBeUndefined();
    expect(c.units).toHaveLength(4);
    const busy = new Set([...a.units, ...b.units].map((u: Unit) => u.truckId));
    expect(c.units.some((u: Unit) => busy.has(u.truckId))).toBe(false);

    for (const inc of [a, b, c]) await http.post(`/api/incidents/${inc.id}/close`).set(manilaRadio).expect(200);
  });

  it('shows incidents by area', async () => {
    const manilaFire = (await dispatch(manilaRadio, SAMPALOC).expect(201)).body;
    const caloocanFire = (await dispatch(caloocanRadio, MONUMENTO).expect(201)).body;
    const ids = async (auth: Record<string, string>) => (await http.get('/api/incidents?status=OPEN').set(auth).expect(200)).body.map((i: { id: string }) => i.id);

    expect(await ids(regionalRadio)).toEqual(expect.arrayContaining([manilaFire.id, caloocanFire.id]));
    expect(await ids(admin)).toEqual(expect.arrayContaining([manilaFire.id, caloocanFire.id]));
    expect(await ids(fd2Radio)).toContain(caloocanFire.id);
    expect(await ids(caloocanRadio)).toContain(caloocanFire.id);

    // An office also sees fires its own stations responded to or are on the running card for (it was notified).
    const fd2Involved =
      manilaFire.units.some((u: { station: { districtId: number } }) => u.station.districtId === 2) ||
      manilaFire.runningCard.some((a: { stations: { district: { code: number } }[] }) => a.stations.some((st) => st.district.code === 2));
    expect((await ids(fd2Radio)).includes(manilaFire.id)).toBe(fd2Involved);
    if (!fd2Involved) await http.get(`/api/incidents/${manilaFire.id}`).set(fd2Radio).expect(403);

    await http.post(`/api/incidents/${manilaFire.id}/close`).set(manilaRadio).expect(200);
    await http.post(`/api/incidents/${caloocanFire.id}/close`).set(caloocanRadio).expect(200);
  });
});
