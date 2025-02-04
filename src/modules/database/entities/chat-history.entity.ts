import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';

@Entity('chat_histories')
export class ChatHistoryEntity extends BaseEntity {
  @Column({ type: 'text' })
  message: string; // Tin nhắn người dùng

  @Column({ type: 'text' })
  response: string; // Phản hồi của bot

  @ManyToOne(() => UserEntity, user => user.id)
  user: UserEntity;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 20, default: 'user' })
  role: string; // Vai trò: 'user' hoặc 'assistant'
} 