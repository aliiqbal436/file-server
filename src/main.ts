import { NestFactory } from '@nestjs/core';
import { AppModule } from './file.module';
import * as fs from 'fs';
import * as https from 'https';
import { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface';
import { NestApplicationOptions } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

async function bootstrap() {
  const corsOptions: CorsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  };
  const httpsOptions: HttpsOptions = {
    key: fs.readFileSync(process.env.CERTKEYPATH),
    cert: fs.readFileSync(process.env.CERTCRTPATH),
  };
  const server = https.createServer(httpsOptions);
  const app = await NestFactory.create(AppModule, {
    httpsOptions: server,
    cors: true,
  } as NestApplicationOptions);

  app.enableCors(corsOptions);

  await app.listen(process.env.APP_PORT);
}
bootstrap();