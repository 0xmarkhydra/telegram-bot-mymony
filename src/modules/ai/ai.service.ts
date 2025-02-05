import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat';
import { ChatHistoryRepository } from '@/database/repositories/chat-history.repository';
import { UserRepository } from '@/database/repositories';

@Injectable()
export class AIService {
  private openai: OpenAI;
  private context = `Bạn là một trợ lý tài chính thông minh, nhiệm vụ của bạn là giúp người dùng:
  1. Phân tích chi tiêu
  2. Đưa ra lời khuyên về quản lý tài chính
  3. Trả lời các câu hỏi liên quan đến tài chính cá nhân
  Hãy trả lời bằng tiếng Việt một cách thân thiện và dễ hiểu.`;

  constructor(
    private configService: ConfigService,
    private chatHistoryRepository: ChatHistoryRepository,
    private userRepository: UserRepository,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async processMessage(message: string, telegramId: string): Promise<string> {
    try {
      // Tìm user dựa vào telegram_id
      const user = await this.userRepository.findOne({
        where: { telegram_id: telegramId }
      });

      if (!user) {
        return 'Vui lòng khởi động bot bằng cách gửi tin nhắn bất kỳ trước khi tiếp tục.';
      }

      // Lấy 5 tin nhắn gần nhất
      const chatHistory = await this.chatHistoryRepository.getLast5Messages(user.id);
      
      console.log('chatHistory', chatHistory);
      // Tạo messages cho OpenAI API
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: this.context },
        ...chatHistory.reverse().map(chat => ({
          role: chat.role as 'user' | 'assistant',
          content: chat.role === 'user' ? chat.message : chat.response
        })),
        { role: 'user', content: message }
      ];

      const completion = await this.openai.chat.completions.create({
        messages,
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = completion.choices[0].message.content || 'Xin lỗi, tôi không thể xử lý yêu cầu này.';

      // Lưu tin nhắn vào lịch sử
      await this.chatHistoryRepository.save({
        message,
        response,
        user_id: user.id,
        role: 'user'
      });

      // Lưu cả phản hồi của bot
      await this.chatHistoryRepository.save({
        message: response,
        response: '',
        user_id: user.id,
        role: 'assistant'
      });

      return response;
    } catch (error) {
      console.error('OpenAI Error:', error);
      return 'Xin lỗi, đã có lỗi xảy ra khi xử lý tin nhắn của bạn.';
    }
  }

  async analyzeExpense(description: string): Promise<{
    category: string;
    suggestion?: string;
  }> {
    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'user',
          content: `Phân tích khoản chi tiêu sau và phân loại vào một trong các danh mục:
          Ăn uống, Di chuyển, Mua sắm, Hóa đơn, Giải trí, Sức khỏe, Giáo dục, Đầu tư.
          Đồng thời đưa ra gợi ý ngắn gọn nếu cần thiết.
          Chi tiêu: "${description}"
          Trả về dưới dạng JSON với format: {"category": "danh_mục", "suggestion": "gợi_ý"}`
        }
      ];

      const completion = await this.openai.chat.completions.create({
        messages,
        model: 'gpt-3.5-turbo',
        temperature: 0.3,
        max_tokens: 200,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return {
        category: result.category || 'Khác',
        suggestion: result.suggestion,
      };
    } catch (error) {
      console.error('OpenAI Analysis Error:', error);
      return { category: 'Khác' };
    }
  }

  async isExpenseMessage(message: string): Promise<boolean> {
    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'user',
          content: `Phân tích xem tin nhắn sau có phải là một khoản chi tiêu hay không.
          Tin nhắn phải chứa số tiền (có thể có 'k' hoặc 'K' ở cuối) và mô tả chi tiêu.
          Ví dụ hợp lệ: 
          - "Ăn cơm 40k"
          - "Mua sách 150000"
          - "Đi taxi về nhà 60k"
          
          Tin nhắn cần phân tích: "${message}"
          
          Trả về dưới dạng JSON với format: {"is_expense": true/false}
          Chỉ trả về JSON, không cần giải thích thêm.`
        }
      ];

      const completion = await this.openai.chat.completions.create({
        messages,
        model: 'gpt-3.5-turbo',
        temperature: 0.3,
        max_tokens: 50,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return result.is_expense || false;

    } catch (error) {
      console.error('AI Expense Detection Error:', error);
      // Fallback về regex nếu AI fail
      return !!message.match(/.*\d+[kK]?$/);
    }
  }
} 