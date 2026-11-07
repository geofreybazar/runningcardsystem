import type { INestApplication } from '@nestjs/common';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { cityId, createApp, makeUser, superAdminAuth } from './helpers.js';

const NORTH_TONDO = { lat: 14.6305, lng: 120.97 }; // Manila, next to Caloocan
const MONUMENTO = { lat: 14.6573, lng: 120.9839 }; // Caloocan

type Auth = Record<string, string>;
type Note = { incidentId: string; cityIds: number[]; type: string; alarmLevel: string; units: { callSign: string; cityId: number }[]; unread: boolean };
type Unit = { alarmLevel: string; stationId: number; station: { name: string; cityId: number }; truck: { callSign: string } };

describe('notifications to involved cities, their districts and the Regional office', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let superAdmin: Auth, manilaRadio: Auth, caloocanRadio: Auth, caloocanOps: Auth, fd2Radio: Auth, farRadio: Auth, regionalRadio: Auth;
  let manila: number, caloocan: number;

  beforeAll(async () => {
    app = await createApp();
    http = request(app.getHttpServer());
    superAdmin = await superAdminAuth(app);
    [manila, caloocan] = [await cityId(app, superAdmin, 'Manila'), await cityId(app, superAdmin, 'Caloocan')];
    const muntinlupa = await cityId(app, superAdmin, 'Muntinlupa'); // far south: never on a Tondo running card
    manilaRadio = await makeUser(app, superAdmin, 'N6001', 'RADIO_OPERATOR', { officeLevel: 'DISTRICT', districtId: 1 });
    caloocanRadio = await makeUser(app, superAdmin, 'N6002', 'RADIO_OPERATOR', { officeLevel: 'CITY', cityId: caloocan });
    caloocanOps = await makeUser(app, superAdmin, 'N6003', 'OPERATIONS', { officeLevel: 'CITY', cityId: caloocan });
    fd2Radio = await makeUser(app, superAdmin, 'N6004', 'RADIO_OPERATOR', { officeLevel: 'DISTRICT', districtId: 2 });
    farRadio = await makeUser(app, superAdmin, 'N6005', 'RADIO_OPERATOR', { officeLevel: 'CITY', cityId: muntinlupa });
    regionalRadio = await makeUser(app, superAdmin, 'N6006', 'RADIO_OPERATOR');
  });
  afterAll(() => app.close());

  const notes = async (auth: Auth, incidentId: string): Promise<Note[]> =>
    (await http.get('/api/notifications').set(auth).expect(200)).body.filter((n: Note) => n.incidentId === incidentId);
  const callSigns = (units: Unit[], city?: number, level?: string) =>
    units.filter((u) => (!city || u.station.cityId === city) && (!level || u.alarmLevel === level)).map((u) => u.truck.callSign).sort();
  const signs = (n: Note) => n.units.map((u) => u.callSign).sort();

  it('notifies the fire’s city, cities that send trucks or are on the card, their districts and Regional; no one else', async () => {
    const created = (await http.post('/api/incidents').set(manilaRadio).send({ ...NORTH_TONDO, locationLabel: 'Tondo fire' }).expect(201)).body;
    expect(created.city.id).toBe(manila);
    const raised = (await http.post(`/api/incidents/${created.id}/raise`).set(manilaRadio).send({}).expect(200)).body;
    const units: Unit[] = raised.units;
    expect(callSigns(units, caloocan).length).toBeGreaterThan(0); // the premise: Caloocan trucks respond to this Manila fire

    // One notification per step; each office sees only its own trucks in it.
    const manilaNotes = await notes(manilaRadio, created.id);
    expect(manilaNotes.map((n) => n.type).sort()).toEqual(['ALARM_RAISED', 'DISPATCHED']);
    expect(signs(manilaNotes.find((n) => n.type === 'DISPATCHED')!)).toEqual(callSigns(units, manila, '1st Alarm'));
    for (const auth of [caloocanRadio, caloocanOps, fd2Radio]) {
      const raisedNote = (await notes(auth, created.id)).find((n) => n.type === 'ALARM_RAISED')!;
      expect(raisedNote.alarmLevel).toBe('2nd Alarm');
      expect(raisedNote.cityIds).toContain(caloocan);
      expect(raisedNote.unread).toBe(true);
    }
    expect(signs((await notes(caloocanRadio, created.id)).find((n) => n.type === 'ALARM_RAISED')!)).toEqual(callSigns(units, caloocan, '2nd Alarm'));

    // The Regional office gets every step with every truck.
    const regional = await notes(regionalRadio, created.id);
    expect(regional).toHaveLength(2);
    expect(signs(regional.find((n) => n.type === 'DISPATCHED')!)).toEqual(callSigns(units, undefined, '1st Alarm'));

    // A city that is only on the running card (no truck sent) is notified and may open the incident.
    const stations: { id: number; cityId: number }[] = (await http.get('/api/stations').set(superAdmin).expect(200)).body;
    const cityOf = new Map(stations.map((s) => [s.id, s.cityId]));
    const unitCities = new Set(units.map((u) => u.station.cityId));
    const cardOnly = (created.runningCard as { stations: { id: number }[] }[])
      .flatMap((a) => a.stations.map((s) => cityOf.get(s.id)!))
      .find((c) => c && c !== manila && !unitCities.has(c));
    expect(cardOnly).toBeDefined(); // premise: the card reaches a city that sent nothing yet
    const cardOnlyOps = await makeUser(app, superAdmin, 'N6007', 'OPERATIONS', { officeLevel: 'CITY', cityId: cardOnly });
    const cardNotes = await notes(cardOnlyOps, created.id);
    expect(cardNotes.map((n) => n.type).sort()).toEqual(['ALARM_RAISED', 'DISPATCHED']);
    expect(cardNotes.every((n) => n.units.length === 0)).toBe(true);
    await http.get(`/api/incidents/${created.id}`).set(cardOnlyOps).expect(200);

    // A city not involved at all gets nothing and can't open it.
    expect(await notes(farRadio, created.id)).toEqual([]);
    await http.get(`/api/incidents/${created.id}`).set(farRadio).expect(403);

    // Seen is per account.
    expect((await http.get('/api/notifications/unread-count').set(caloocanOps).expect(200)).body.count).toBeGreaterThan(0);
    await http.post('/api/notifications/seen').set(caloocanOps).expect(204);
    expect((await http.get('/api/notifications/unread-count').set(caloocanOps).expect(200)).body.count).toBe(0);
    expect((await http.get('/api/notifications/unread-count').set(caloocanRadio).expect(200)).body.count).toBeGreaterThan(0);

    // Closing tells each office which of its trucks were released.
    await http.post(`/api/incidents/${created.id}/close`).set(manilaRadio).expect(200);
    expect(signs((await notes(caloocanOps, created.id)).find((n) => n.type === 'INCIDENT_CLOSED')!)).toEqual(callSigns(units, caloocan));
    expect(signs((await notes(regionalRadio, created.id)).find((n) => n.type === 'INCIDENT_CLOSED')!)).toEqual(callSigns(units));
    expect((await notes(cardOnlyOps, created.id)).filter((n) => n.type === 'INCIDENT_CLOSED')).toHaveLength(1);
    expect(await notes(farRadio, created.id)).toEqual([]);
  });

  it('viewing an incident marks its notifications read, and the incident keeps a time log', async () => {
    const fire = (await http.post('/api/incidents').set(caloocanRadio).send({ ...MONUMENTO, locationLabel: 'Log fire' }).expect(201)).body;
    await http.post(`/api/incidents/${fire.id}/raise`).set(caloocanRadio).send({}).expect(200);
    await http.post('/api/notifications/seen').set(fd2Radio).expect(204); // start clean, then one new step
    await http.post(`/api/incidents/${fire.id}/raise`).set(caloocanRadio).send({}).expect(200);

    expect((await notes(fd2Radio, fire.id)).some((n) => n.unread)).toBe(true);
    const before = (await http.get('/api/notifications/unread-count').set(fd2Radio).expect(200)).body.count;
    await http.post('/api/notifications/seen').set(fd2Radio).send({ incidentId: fire.id }).expect(204);
    expect((await notes(fd2Radio, fire.id)).every((n) => !n.unread)).toBe(true);
    expect((await http.get('/api/notifications/unread-count').set(fd2Radio).expect(200)).body.count).toBeLessThan(before);
    expect((await notes(regionalRadio, fire.id)).some((n) => n.unread)).toBe(true); // per account
    await http.post('/api/notifications/seen').set(fd2Radio).send({ incidentId: '00000000-0000-4000-8000-000000000000' }).expect(404);

    await http.post(`/api/incidents/${fire.id}/close`).set(caloocanRadio).expect(200);
    const detail = (await http.get(`/api/incidents/${fire.id}`).set(fd2Radio).expect(200)).body;
    expect(detail.timeline.map((t: { type: string; alarmLevel: string }) => `${t.type} ${t.alarmLevel}`)).toEqual([
      'DISPATCHED 1st Alarm',
      'ALARM_RAISED 2nd Alarm',
      'ALARM_RAISED 3rd Alarm',
      'INCIDENT_CLOSED 3rd Alarm',
    ]);
    expect(detail.timeline.every((t: { by: { accountNumber: string }; at: string }) => t.by.accountNumber === 'N6002' && t.at)).toBe(true);
    expect(detail.units[0].station.city.name).toBeTruthy();
  });

  it('streams new notifications live (SSE) to the offices they are for', async () => {
    const server = app.getHttpServer();
    if (!server.listening) await new Promise<void>((resolve) => server.listen(0, resolve));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const abort = new AbortController();
    const res = await fetch(`${base}/api/notifications/stream`, { headers: regionalRadio, signal: abort.signal });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    await fetch(`${base}/api/notifications/stream`).then((r) => expect(r.status).toBe(401));

    const incident = (await http.post('/api/incidents').set(caloocanRadio).send({ ...MONUMENTO, locationLabel: 'Stream fire' }).expect(201)).body;
    const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
    let text = '';
    while (!text.includes(incident.id)) text += (await reader.read()).value ?? '';
    expect(text).toContain('event: notification');
    abort.abort();
    await http.post(`/api/incidents/${incident.id}/close`).set(caloocanRadio).expect(200);
  });
});
