import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { FileAccessSchema, FileAccess } from './file-access.entity';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { VideoService } from './video.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HttpModule,
    ConfigModule.forRoot(),
    // MongooseModule.forRoot(process.env.DATABASE_URL),
    // MongooseModule.forFeature([
    //   { name: FileAccess.name, schema: FileAccessSchema },
    // ]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [FileController],
  providers: [FileService, VideoService],
})
export class AppModule {}
