import { DataSource, Repository } from 'typeorm';
import { ChatHistoryEntity } from '../entities/chat-history.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatHistoryRepository extends Repository<ChatHistoryEntity> {
  constructor(private dataSource: DataSource) {
    super(ChatHistoryEntity, dataSource.createEntityManager());
  }

  async getLast5Messages(userId: string): Promise<ChatHistoryEntity[]> {
    return this.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: 5
    });
  }
} 