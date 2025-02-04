import { DataSource, Repository } from 'typeorm';
import { ExpenseEntity } from '../entities/expense.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ExpenseRepository extends Repository<ExpenseEntity> {
  constructor(private dataSource: DataSource) {
    super(ExpenseEntity, dataSource.createEntityManager());
  }
} 