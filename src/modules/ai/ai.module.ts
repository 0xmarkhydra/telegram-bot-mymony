import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';
import { DatabaseModule } from '@/database';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
  ],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {} 