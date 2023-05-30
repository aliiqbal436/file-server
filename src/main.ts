import { NestFactory } from '@nestjs/core';
import { AppModule } from './file.module';
import * as fs from 'fs';
import * as https from 'https';
import { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface';
import { NestApplicationOptions } from '@nestjs/common';

async function bootstrap() {
  // const httpsOptions: HttpsOptions = {
  //   key: fs.readFileSync(process.env.CERTKEYPATH),
  //   cert: fs.readFileSync(process.env.CERTCRTPATH),
  // };
  // const server = https.createServer(httpsOptions);
  const app = await NestFactory.create(AppModule);

  await app.listen(process.env.APP_PORT);
}
bootstrap();
