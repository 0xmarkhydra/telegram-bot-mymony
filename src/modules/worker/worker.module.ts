import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configQueue } from './configs';
import { DatabaseModule } from '@/database';
import { ScheduleService } from './schedulers/schedule.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ApiModule } from '@/api';
import { TelegramModule } from '../telegram/telegram.module';
import { AIModule } from '../ai/ai.module';
// import { BullModule } from '@nestjs/bull';

const isWorker = Boolean(Number(process.env.IS_WORKER || 0));

let consumers = [];
let schedulers = [];

if (isWorker) {
  consumers = [];
  schedulers = [ScheduleService];
}

@Module({
  imports: [
    ApiModule,
    DatabaseModule,
    AIModule,
    TelegramModule,
    // BullModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory(config: ConfigService) {
    //     const host = config.get<string>('queue.host');
    //     const port = config.get<number>('queue.port');
    //     const db = config.get<number>('queue.database');
    //     const password = config.get<string>('queue.password');
    //     // const tls = config.get('queue.tls');
    //     return {
    //       redis: {
    //         host: host,
    //         port: port,
    //         db: db,
    //         password: password,
    //         // tls,
    //       },
    //     };
    //   },
    //   inject: [ConfigService],
    // }),
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [configQueue],
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [],
  providers: [...consumers, ...schedulers],
  exports: [],
})
export class WorkerModule {}
