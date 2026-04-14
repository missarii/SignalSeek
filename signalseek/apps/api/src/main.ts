import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  app.use(helmet());
  app.use(cookieParser());
  const web = (process.env.APP_BASE_URL || 'http://localhost:3000').trim();
  app.enableCors({ origin: [web], credentials: true });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const cfg = new DocumentBuilder().setTitle('SignalSeek API').setVersion('0.1.0')
    .addBearerAuth().build();
  const doc = SwaggerModule.createDocument(app, cfg);
  SwaggerModule.setup('api/docs', app, doc);
  const port = Number(process.env.API_PORT || 4000);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ msg: 'api listening', port }));
}
bootstrap();
