import 'dotenv/config';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.LOGIN_RATE_LIMIT = '1000'; // the suite signs in far more than a person would

export async function createApp(): Promise<INestApplication> {
  // Imported after DATABASE_URL is switched to the test database.
  const { AppModule } = await import('../src/app.module.js');
  const { configureApp } = await import('../src/app.setup.js');
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  return configureApp(moduleRef.createNestApplication()).init();
}

export const refreshCookie = (res: request.Response) =>
  ([] as string[]).concat(res.headers['set-cookie'] ?? []).find((c) => c.startsWith('rcs_rt='))?.split(';')[0];

/** Logs in and, if the account still has a temporary password, changes it. Returns a bearer header. */
export async function signIn(app: INestApplication, accountNumber: string, password: string, newPassword = 'Changed-pass-1') {
  const http = request(app.getHttpServer());
  const login = await http.post('/api/auth/login').send({ accountNumber, password }).expect(200);
  let token: string = login.body.accessToken;
  if (login.body.user.mustChangePassword) {
    const changed = await http
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: password, newPassword })
      .expect(200);
    token = changed.body.accessToken;
  }
  return { Authorization: `Bearer ${token}` };
}

/** The seeded super admin; whichever spec runs first changes its temporary password. */
export const superAdminAuth = (app: INestApplication) =>
  signIn(app, 'superadmin', 'Super-pass-1').catch(() => signIn(app, 'superadmin', 'Initial-pass-1', 'Super-pass-1'));

export type OfficeInput = { officeLevel?: 'REGIONAL' | 'DISTRICT' | 'CITY'; districtId?: number; cityId?: number };

/** A valid create-user body; `extra` overrides fields (rank is ignored for SUPER_ADMIN). */
export const person = (accountNumber: string, role: string, extra: Record<string, unknown> = {}) => ({
  rank: 'FO1',
  firstName: 'Test',
  lastName: accountNumber,
  accountNumber,
  role,
  ...extra,
});

export async function makeUser(app: INestApplication, admin: Record<string, string>, accountNumber: string, role: string, office: OfficeInput = {}) {
  const res = await request(app.getHttpServer()).post('/api/users').set(admin).send(person(accountNumber, role, office)).expect(201);
  return signIn(app, accountNumber, res.body.temporaryPassword);
}

/** City id by name, e.g. cityId(app, auth, 'Caloocan'). */
export async function cityId(app: INestApplication, auth: Record<string, string>, name: string): Promise<number> {
  const districts = (await request(app.getHttpServer()).get('/api/districts').set(auth).expect(200)).body;
  return districts.flatMap((d: { cities: { id: number; name: string }[] }) => d.cities).find((c: { name: string }) => c.name === name).id;
}
