import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder,SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { Request,Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app/app.module';
import './infrastructure/config';
import { SafeExceptionFilter } from './shared/presentation/exception.filter';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const express = app.getHttpAdapter().getInstance();
  express.disable('x-powered-by');
  if (process.env.TRUST_PROXY === 'true') express.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());
  app.use((req: Request, res: Response, next: () => void) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  app.enableCors({ origin: (process.env.WEB_ORIGIN ?? 'http://localhost:5173').split(',').map(s => s.trim()), credentials: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new SafeExceptionFilter());
  const document = SwaggerModule.createDocument(app, new DocumentBuilder()
    .setTitle('Mi Gasolinera · Ciclo 1').setDescription('API de usuarios, roles, permisos, empresa y bitácora. Las mutaciones requieren X-CSRF-Token obtenido con GET /api/auth/csrf.')
    .setVersion('1.0.0').addCookieAuth('access_token').addApiKey({ type: 'apiKey', in: 'header', name: 'X-CSRF-Token' }, 'csrf').build());
  SwaggerModule.setup('api/docs', app, document);
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT ?? 3000), process.env.HOST ?? '0.0.0.0');
}
bootstrap().catch(error => { console.error(error.message); process.exitCode = 1; });
