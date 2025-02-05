import { Injectable } from '@nestjs/common';
import { ExpenseRepository } from '@/database/repositories/expense.repository';
import { AIService } from '../../ai/ai.service';
import { ExpenseEntity } from '@/database/entities/expense.entity';
import { UserRepository } from '@/database/repositories';
import { Between, MoreThanOrEqual } from 'typeorm';

@Injectable()
export class ExpenseCommandService {
  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly userRepository: UserRepository,
    private readonly aiService: AIService,
  ) {}

  async processExpenseMessage(message: string, telegramId: string): Promise<string> {
    try {
      // Tìm user dựa vào telegram_id
      const user = await this.userRepository.findOne({
        where: { telegram_id: telegramId }
      });

      if (!user) {
        return 'Vui lòng khởi động bot bằng cách gửi tin nhắn bất kỳ trước khi thêm chi tiêu.';
      }

      // Tách số tiền từ cuối chuỗi
      const matches = message.match(/(.*?)(\d+)[kK]?$/);
      
      if (!matches) {
        return 'Vui lòng nhập theo định dạng: "Mô tả chi tiêu + số tiền"\nVí dụ: Ăn cơm 40k';
      }

      const description = matches[1].trim();
      let amount = parseInt(matches[2]);

      // Xử lý đơn vị k/K (nghìn đồng)
      if (message.toLowerCase().endsWith('k')) {
        amount *= 1000;
      }

      // Phân tích chi tiêu bằng AI
      const analysis = await this.aiService.analyzeExpense(description);

      // Lưu vào database
      const expense = new ExpenseEntity();
      expense.description = description;
      expense.amount = amount;
      expense.user_id = user.id; // Sử dụng UUID của user
      await this.expenseRepository.save(expense);

      // Tạo phản hồi
      let response = `✅ Đã ghi nhận chi tiêu:\n`;
      response += `📝 Mô tả: ${description}\n`;
      response += `💰 Số tiền: ${amount.toLocaleString('vi-VN')}đ\n`;
      response += `📊 Phân loại: ${analysis.category}`;
      
      if (analysis.suggestion) {
        response += `\n💡 Gợi ý: ${analysis.suggestion}`;
      }

      return response;

    } catch (error) {
      console.error('Process expense error:', error);
      return 'Có lỗi xảy ra khi xử lý chi tiêu. Vui lòng thử lại sau.';
    }
  }

  async getTodayExpenses(telegramId: string): Promise<string> {
    try {
      const user = await this.userRepository.findOne({
        where: { telegram_id: telegramId }
      });

      if (!user) {
        return 'Vui lòng khởi động bot bằng cách gửi tin nhắn bất kỳ trước khi xem chi tiêu.';
      }

      // Lấy thời gian đầu ngày và cuối ngày theo múi giờ UTC+7
      const now = new Date();
      const utcOffset = 7; // UTC+7 cho Việt Nam

      // Điều chỉnh về đầu ngày theo UTC+7
      const startOfDay = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        -utcOffset, // 00:00 UTC+7 = 17:00 UTC ngày hôm trước
        0,
        0
      ));

      // Điều chỉnh về cuối ngày theo UTC+7
      const endOfDay = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        24 - utcOffset - 1, // 23:59:59 UTC+7 = 16:59:59 UTC
        59,
        59,
        999
      ));

      console.log('Current UTC time:', new Date().toISOString());
      console.log('startOfDay UTC:', startOfDay.toISOString());
      console.log('endOfDay UTC:', endOfDay.toISOString());

      const expenses = await this.expenseRepository.find({
        where: {
          user_id: user.id,
          created_at: Between(startOfDay, endOfDay)
        },
        order: {
          created_at: 'ASC'
        }
      });

      if (expenses.length === 0) {
        return '📊 Hôm nay bạn chưa có khoản chi tiêu nào.';
      }

      let total = 0;
      let response = '📊 Chi tiêu hôm nay:\n\n';

      expenses.forEach(expense => {
        response += `• ${expense.description}: ${expense.amount.toLocaleString('vi-VN')}đ\n`;
        total += Number(expense.amount);
      });

      response += `\n💰 Tổng chi: ${total.toLocaleString('vi-VN')}đ`;
      return response;

    } catch (error) {
      console.error('Get today expenses error:', error);
      return 'Có lỗi xảy ra khi lấy thông tin chi tiêu. Vui lòng thử lại sau.';
    }
  }
} 