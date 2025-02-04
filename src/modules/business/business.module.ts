import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database';
// import { TokenRepository } from '@/database/repositories/token.repository';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([])
  ],
  providers: [],
  exports: [],
})
export class BusinessModule {}
