import { StandardSchemaValidationPipe, type INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';

/** Shared by main.ts and the e2e tests so both run the same pipeline. */
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  // Zod schemas on @Body/@Query({ schema }); they are strict objects, so unknown fields are rejected.
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.enableCors({ origin: process.env.FRONTEND_ORIGIN, credentials: true });
  return app;
}
