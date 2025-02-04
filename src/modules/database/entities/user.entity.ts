import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ExpenseEntity } from './expense.entity';

@Entity('users')
export class UserEntity extends BaseEntity {
  @Column({ unique: true, nullable: true })
  address: string;

  @Column({ nullable: true, unique: true })
  telegram_id: string;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  first_name: string;

  @OneToMany(() => ExpenseEntity, expense => expense.user)
  expenses: ExpenseEntity[];
}
