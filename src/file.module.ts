import { Module, OnModuleInit } from '@nestjs/common';
import { FileController } from './file.controller';
import { AppService } from './file.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { FileAccessSchema, FileAccess } from './file-access.entity';
import { HttpModule, HttpService } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { VideoService } from './video.service';
import * as OS from 'os'
@Module({
  imports: [
    ScheduleModule.forRoot(),
    HttpModule,
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.DATABASE_URL),
    MongooseModule.forFeature([
      { name: FileAccess.name, schema: FileAccessSchema },
    ]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [FileController],
  providers: [AppService, VideoService],
})
export class AppModule implements OnModuleInit {

  constructor(
      private readonly httpService: HttpService,
  ) {}

  public onModuleInit(): any {
    const axios = this.httpService.axiosRef;
    let os_name = OS.hostname();
    let network = OS.networkInterfaces();
    // console.log(os_name," ----> ",network);
    const key = Object.keys(network).find(item => ['en0','eth0'].includes(item));
    const input_data = {
      "ipfs_id":"test",
      "ipfs_cluster_id":"id",
      "Ip_adress":network[key][1].address,
      "name": os_name,
      "total_storage":process.env.TOTAL_STORAGE
    };
    axios.post(process.env.NODE_SERVICE, input_data).then((res) => {
      console.log(res.data);
    }).catch((err) => {
      console.log(err);
    });
  }
  
}
