import { Module } from '@nestjs/common';
import { configDb } from './configs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@/database/entities';
import { AdminConfigRepository, UserRepository } from './repositories';
import { AdminConfigEntity } from './entities/admin-config.entity';
import { SeedDatabase } from './seeders/seed.database';
import { ExpenseEntity } from './entities/expense.entity';
import { ExpenseRepository } from './repositories/expense.repository';
import { ChatHistoryRepository } from './repositories/chat-history.repository';
import { ChatHistoryEntity } from './entities/chat-history.entity';

const repositories = [
  UserRepository,
  AdminConfigRepository,
  ExpenseRepository,
  ChatHistoryRepository
];

const services = [];

const entities = [
  UserEntity,
  AdminConfigEntity,
  ExpenseEntity,
  ChatHistoryEntity
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => config.get('db'),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(entities),
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [configDb],
    }),
  ],
  controllers: [],
  providers: [...repositories, ...services, SeedDatabase],
  exports: [...repositories, ...services],
})
export class DatabaseModule {}
