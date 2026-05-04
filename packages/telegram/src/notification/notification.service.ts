import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly token: string;
  private readonly chatId: string;

  constructor(private readonly configService: ConfigService) {
    this.token = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || '';
    this.chatId = this.configService.get<string>('TELEGRAM_CHAT_ID') || '';
  }

  // Отправляет сообщение в Telegram Bot API и возвращает результат
  async sendTelegramMessage(dto: SendNotificationDto) {
    if (!this.token || !this.chatId) {
      this.logger.warn('Telegram bot token or chat id is not configured');
      return { ok: false, reason: 'Telegram configuration missing' };
    }

    const endpoint = `https://api.telegram.org/bot${this.token}/sendMessage`;
    const text = `Event ${dto.eventId}\n${dto.text}\nData: ${JSON.stringify(dto.payload)}`;

    try {
      const response = await axios.post(endpoint, {
        chat_id: this.chatId,
        text,
        parse_mode: 'Markdown'
      });
      this.logger.log(`Telegram message sent for event ${dto.eventId}`);
      return response.data;
    } catch (error) {
      this.logger.error('Telegram API request failed', error instanceof Error ? error.message : String(error));
      return { ok: false, error: error instanceof Error ? error.message : 'unknown' };
    }
  }

  // Возвращает статус работы сервиса и доступность конфигурации Telegram
  getStatus() {
    return {
      status: 'ok',
      telegramConfigured: !!this.token && !!this.chatId,
    };
  }
}
