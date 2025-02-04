import { Injectable } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { UserRepository } from '../database/repositories';
import { InjectRepository } from '@nestjs/typeorm';
import { AIService } from '../ai/ai.service';
import { ExpenseEntity } from '../database/entities/expense.entity';
import { ExpenseRepository } from '../database/repositories/expense.repository';
import { ExpenseCommandService } from './services/expense-command.service';
import { ChatHistoryRepository } from '@/database/repositories/chat-history.repository';

@Injectable()
export class TelegramService {
  private bot: Telegraf;

  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    @InjectRepository(ExpenseRepository)
    private expenseRepository: ExpenseRepository,
    private readonly aiService: AIService,
    private readonly expenseCommandService: ExpenseCommandService,
    private readonly chatHistoryRepository: ChatHistoryRepository,
  ) {
    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    this.watchMessage().catch(console.error);
  }

  async watchMessage() {
    this.bot.command('today', async (ctx) => {
      const userId = ctx.from.id.toString();
      const response = await this.expenseCommandService.getTodayExpenses(userId);
      await ctx.reply(response);
    });

    // Thêm lệnh xem lịch sử chat
    this.bot.command('history', async (ctx) => {
      const userId = ctx.from.id.toString();
      const user = await this.userRepository.findOne({
        where: { telegram_id: userId }
      });

      if (!user) {
        await ctx.reply('Vui lòng khởi động bot trước khi xem lịch sử.');
        return;
      }

      const chatHistory = await this.chatHistoryRepository.getLast5Messages(user.id);
      
      if (chatHistory.length === 0) {
        await ctx.reply('Bạn chưa có lịch sử chat nào.');
        return;
      }

      let response = '📝 5 tin nhắn gần nhất:\n\n';
      chatHistory.forEach((chat, index) => {
        response += `${index + 1}. Bạn: ${chat.message}\n`;
        response += `🤖 Bot: ${chat.response}\n\n`;
      });

      await ctx.reply(response);
    });

    // Lắng nghe tin nhắn từ người dùng
    this.bot.on('text', async (ctx) => {
      const { id, username, first_name } = ctx.update.message.from;
      const message = (ctx.message as Message.TextMessage).text;

      // Kiểm tra và tạo user nếu chưa tồn tại
      const user = await this.userRepository.findOne({
        where: {
          telegram_id: id.toString(),
        },
      });

      if (!user) {
        await this.userRepository.save({
          telegram_id: id.toString(),
          username: username,
          first_name: first_name,
        }).catch(console.error);
      }

      // Kiểm tra nếu tin nhắn có dạng chi tiêu
      if (message.match(/.*\d+[kK]?$/)) {
        const response = await this.expenseCommandService.processExpenseMessage(message, id.toString());
        await ctx.reply(response);
      } else {
        // Xử lý tin nhắn thông thường với AI
        const response = await this.aiService.processMessage(message, id.toString());
        await ctx.reply(response);
      }
    });
  }

  async onApplicationBootstrap() {
    console.log('TelegramService onApplicationBootstrap');
    await this.bot.launch();
  }

  async handleMessage(ctx: Context) {
    const chatId = ctx.chat?.id;
    const text = (ctx.message as Message.TextMessage)?.text;
    const userId = ctx.from?.id;

    if (!chatId || !text || !userId) return;

    if (text.startsWith('/expense')) {
      // Xử lý lệnh thêm chi tiêu
      // ... existing expense handling code ...
    } else {
      // Xử lý tin nhắn thông thường bằng AI
      const response = await this.aiService.processMessage(text, userId.toString());
      await ctx.telegram.sendMessage(chatId, response);
    }
  }

  async handleExpense(description: string, amount: number, userId: string) {
    const analysis = await this.aiService.analyzeExpense(description);
    
    const expense = new ExpenseEntity();
    expense.description = description;
    expense.amount = amount;
    expense.user_id = userId;
    
    // Lưu expense vào database
    await this.expenseRepository.save(expense);
    
    let response = `Đã ghi nhận khoản chi ${amount}đ cho: ${description}\nPhân loại: ${analysis.category}`;
    if (analysis.suggestion) {
      response += `\nGợi ý: ${analysis.suggestion}`;
    }
    return response;
  }
}
