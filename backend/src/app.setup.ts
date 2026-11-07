import { StandardSchemaValidationPipe, type INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

/** Shared by main.ts and the e2e tests so both run the same pipeline. */
export function configureApp(app: INestApplication) {
  // Behind nginx every request comes from the proxy; trusting it makes req.ip the real client, so rate limits are per
  // client, not shared by everyone. Only set it when a proxy is really in front, or clients could fake their IP.
  if (process.env.TRUST_PROXY) (app as NestExpressApplication).set('trust proxy', trustProxy(process.env.TRUST_PROXY));
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  // Zod schemas on @Body/@Query({ schema }); they are strict objects, so unknown fields are rejected.
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.enableCors({ origin: process.env.FRONTEND_ORIGIN, credentials: true });
  return app;
}

/** TRUST_PROXY: a hop count ("1"), "true", or a list of proxy addresses/subnets ("loopback, 172.16.0.0/12"). */
export function trustProxy(value: string): number | boolean | string {
  if (/^\d+$/.test(value)) return Number(value);
  if (value === 'true' || value === 'false') return value === 'true';
  return value;
}
