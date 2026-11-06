import 'dotenv/config';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

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
export async function signIn(app: INestApplication, username: string, password: string, newPassword = 'Changed-pass-1') {
  const http = request(app.getHttpServer());
  const login = await http.post('/api/auth/login').send({ username, password }).expect(200);
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

export async function makeUser(app: INestApplication, admin: Record<string, string>, username: string, role: string, districtId?: number) {
  const res = await request(app.getHttpServer()).post('/api/users').set(admin).send({ username, fullName: username, role, districtId }).expect(201);
  return signIn(app, username, res.body.temporaryPassword);
}
