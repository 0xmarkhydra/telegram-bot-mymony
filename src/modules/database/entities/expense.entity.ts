import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { BaseEntity } from './base.entity';
// export enum ExpenseCategory {
//   AN_UONG = 'Ăn uống',           // Ăn uống
//   DI_CHUYEN = 'Di chuyển',       // Di chuyển
//   MUA_SAM = 'Mua sắm',           // Mua sắm
//   HOA_DON = 'Hóa đơn',           // Hóa đơn (điện, nước, internet...)
//   GIAI_TRI = 'Giải trí',         // Giải trí
//   SUC_KHOE = 'Sức khỏe',         // Sức khỏe
//   GIAO_DUC = 'Giáo dục',        // Giáo dục
//   KHAC = 'Đầu tư'               // Khác
// }

@Entity('expenses')
export class ExpenseEntity extends BaseEntity {
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number; // Số tiền chi tiêu

  // Đơn vị tiền tệ
  @Column({ type: 'varchar', length: 10, default: 'VNĐ' })
  currency: string;

  @Column({ type: 'varchar', length: 255 })
  description: string; // Mô tả khoản chi

  @ManyToOne(() => UserEntity, user => user.id)
  user: UserEntity; // Người dùng tạo khoản chi

  @Column({ type: 'uuid', nullable: true })
  user_id: string;
} 