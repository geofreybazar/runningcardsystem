import 'dotenv/config'; // before any module reads process.env at import time (e.g. the login rate limit)
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

const app = configureApp(await NestFactory.create(AppModule));
// The Swagger UI bypasses Nest guards and lists every route: off unless asked for, and never on by default in production.
if (process.env.SWAGGER === 'true' || (process.env.SWAGGER === undefined && process.env.NODE_ENV !== 'production')) {
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('BFP-NCR Running Card API').addBearerAuth().build()),
  );
}
await app.listen(process.env.PORT ?? 3000);
