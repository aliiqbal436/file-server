import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { FileController } from './file.controller';
import { AppService } from './file.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { FileAccessSchema, FileAccess } from './file-access.entity';
import { HttpModule } from '@nestjs/axios';
@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.DATABASE_URL),
    MongooseModule.forFeature([
      { name: FileAccess.name, schema: FileAccessSchema },
    ]),
  ],
  controllers: [FileController],
  providers: [AppService],
})
export class AppModule {
  // configure(consumer: MiddlewareConsumer) {
  //   consumer.apply(AuthMiddleware).forRoutes('*');
  // }
}
