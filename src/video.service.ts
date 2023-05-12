import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { readdir, statSync, unlinkSync } from 'fs';
import * as moment from 'moment';

@Injectable()
export class VideoService {
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCron() {
    try {
      readdir('videos', (err, files) => {
        if (err) throw err;
        files.forEach((file) => {
          const fileStat = statSync(`videos/${file}`);
          const minsDiff = moment().diff(moment(fileStat.birthtime), 'hours');
          if (minsDiff >= 6) {
            unlinkSync(`videos/${file}`);
          }
        });
      });
    } catch (error) {
      console.error('cron job error', error);
    }
  }
}
