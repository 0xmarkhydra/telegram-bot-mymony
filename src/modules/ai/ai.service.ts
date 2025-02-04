import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AIService {
  private openai: OpenAI;
  private context = `Bạn là một trợ lý tài chính thông minh, nhiệm vụ của bạn là giúp người dùng:
  1. Phân tích chi tiêu
  2. Đưa ra lời khuyên về quản lý tài chính
  3. Trả lời các câu hỏi liên quan đến tài chính cá nhân
  Hãy trả lời bằng tiếng Việt một cách thân thiện và dễ hiểu.`;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async processMessage(message: string, userId: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        messages: [
          { role: 'system', content: this.context },
          { role: 'user', content: message }
        ],
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 500,
      });

      return completion.choices[0].message.content || 'Xin lỗi, tôi không thể xử lý yêu cầu này.';
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
      const prompt = `Phân tích khoản chi tiêu sau và phân loại vào một trong các danh mục:
      Ăn uống, Di chuyển, Mua sắm, Hóa đơn, Giải trí, Sức khỏe, Giáo dục, Đầu tư.
      Đồng thời đưa ra gợi ý ngắn gọn nếu cần thiết.
      Chi tiêu: "${description}"
      Trả về dưới dạng JSON với format: {"category": "danh_mục", "suggestion": "gợi_ý"}`;

      const completion = await this.openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
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
} 