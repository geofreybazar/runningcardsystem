import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { cityId, createApp, makeUser, superAdminAuth } from './helpers.js';

const MONUMENTO = { lat: 14.6573, lng: 120.9839 }; // Caloocan

type Stats = {
  summary: { incidents: number; mutualAidUnits: number; unitsSent: number };
  byAlarm: { level: string; count: number }[];
  byCity: { name: string; count: number }[];
  workload: { mutualAid: { name: string; sent: number; received: number }[] };
  trend: { bucket: string; count: number }[];
};

describe('statistics', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let superAdmin: Record<string, string>;
  let caloocanRadio: Record<string, string>, farRadio: Record<string, string>, regionalRadio: Record<string, string>;
  let fireId: string;

  beforeAll(async () => {
    app = await createApp();
    http = request(app.getHttpServer());
    superAdmin = await superAdminAuth(app);
    const caloocan = await cityId(app, superAdmin, 'Caloocan');
    caloocanRadio = await makeUser(app, superAdmin, 'T8001', 'RADIO_OPERATOR', { officeLevel: 'CITY', cityId: caloocan });
    farRadio = await makeUser(app, superAdmin, 'T8002', 'RADIO_OPERATOR', { officeLevel: 'CITY', cityId: await cityId(app, superAdmin, 'Muntinlupa') });
    regionalRadio = await makeUser(app, superAdmin, 'T8003', 'RADIO_OPERATOR');
    // A fire whose location label starts with "=" (spreadsheet formula injection check), raised to pull in other cities.
    const fire = (await http.post('/api/incidents').set(caloocanRadio).send({ ...MONUMENTO, locationLabel: '=1+1 Stats fire' }).expect(201)).body;
    fireId = fire.id;
    await http.post(`/api/incidents/${fire.id}/raise`).set(caloocanRadio).send({}).expect(200);
    await http.post(`/api/incidents/${fire.id}/close`).set(caloocanRadio).expect(200);
  });
  afterAll(() => app.close());

  const stats = async (auth: Record<string, string>, query = '') => (await http.get(`/api/statistics${query}`).set(auth).expect(200)).body as Stats;

  it('counts only incidents in the viewer’s area', async () => {
    const caloocan = await stats(caloocanRadio);
    const regional = await stats(regionalRadio);
    const far = await stats(farRadio);
    expect(caloocan.byCity.find((c) => c.name === 'Caloocan')!.count).toBeGreaterThanOrEqual(1);
    expect(regional.summary.incidents).toBeGreaterThanOrEqual(caloocan.summary.incidents);
    expect(far.byCity.some((c) => c.name === 'Caloocan')).toBe(false);
    // Narrowing to another district can't widen what an office sees.
    expect((await stats(caloocanRadio, '?districtId=3')).summary.incidents).toBe(0);
  });

  it('counts only fires inside the office’s cities, not fires elsewhere its trucks responded to', async () => {
    const fire = (await http.get(`/api/incidents/${fireId}`).set(superAdmin).expect(200)).body;
    const helper = fire.units.find((u: { station: { cityId: number | null } }) => u.station.cityId !== null && u.station.cityId !== fire.cityId);
    expect(helper).toBeDefined(); // the raised Monumento fire pulls in a station from another city
    const helperRadio = await makeUser(app, superAdmin, 'T8004', 'RADIO_OPERATOR', { officeLevel: 'CITY', cityId: helper.station.cityId });
    // It can open the incident (its truck responded) but its statistics leave the Caloocan fire out.
    await http.get(`/api/incidents/${fireId}`).set(helperRadio).expect(200);
    expect((await stats(helperRadio)).byCity.some((c) => c.name === 'Caloocan')).toBe(false);
    const csv = (await http.get('/api/statistics/incidents.csv').set(helperRadio).expect(200)).text;
    expect(csv).not.toContain('Stats fire');
  });

  it('reports highest alarm reached, mutual aid and a daily trend', async () => {
    const s = await stats(regionalRadio);
    expect(s.byAlarm.find((a) => a.level === '2nd Alarm')!.count).toBeGreaterThanOrEqual(1);
    expect(s.summary.unitsSent).toBeGreaterThanOrEqual(s.summary.mutualAidUnits);
    // Every mutual-aid truck is sent by one city and received by another.
    const sent = s.workload.mutualAid.reduce((n, m) => n + m.sent, 0);
    const received = s.workload.mutualAid.reduce((n, m) => n + m.received, 0);
    expect(sent).toBe(s.summary.mutualAidUnits);
    expect(received).toBe(s.summary.mutualAidUnits);
    expect(s.trend).toHaveLength(30); // default: the last 30 days, one bucket per day
  });

  it('validates the filters', async () => {
    await http.get('/api/statistics?from=2026-11-08&to=2026-11-01').set(regionalRadio).expect(400);
    await http.get('/api/statistics?from=2020-01-01&to=2026-11-01').set(regionalRadio).expect(400);
    await http.get('/api/statistics?from=yesterday').set(regionalRadio).expect(400);
    await http.get('/api/statistics').expect(401);
  });

  it('exports the incident list as CSV, safe to open in a spreadsheet', async () => {
    const res = await http.get('/api/statistics/incidents.csv').set(caloocanRadio).expect(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toMatch(/^attachment; filename="running-card-incidents_\d{4}-\d{2}-\d{2}_to_\d{4}-\d{2}-\d{2}\.csv"$/);
    const lines = res.text.replace(/^﻿/, '').trim().split('\r\n');
    expect(lines[0]).toContain('"Dispatched (Manila)","Location"');
    const row = lines.find((l) => l.includes('Stats fire'))!;
    expect(row).toContain(`"'=1+1 Stats fire"`); // neutralised formula
    expect(row).toContain('"2nd Alarm"');
    expect(row).toContain('"CLOSED"');
    expect(fireId).toBeTruthy();
    // Another area doesn't get it.
    expect((await http.get('/api/statistics/incidents.csv').set(farRadio).expect(200)).text).not.toContain('Stats fire');
  });
});
