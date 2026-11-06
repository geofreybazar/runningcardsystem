import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

const app = configureApp(await NestFactory.create(AppModule));
SwaggerModule.setup(
  'api/docs',
  app,
  SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('BFP-NCR Running Card API').addBearerAuth().build()),
);
await app.listen(process.env.PORT ?? 3000);
