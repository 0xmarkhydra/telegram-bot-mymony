import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { DatabaseModule } from '../database/database.module';
import { AIModule } from '../ai/ai.module';
import { ExpenseCommandService } from './services/expense-command.service';

@Module({
  imports: [
    DatabaseModule,
    AIModule,
  ],
  providers: [
    TelegramService,
    ExpenseCommandService,
  ],
  exports: [
    TelegramService,
    ExpenseCommandService,
  ],
})
export class TelegramModule {} 