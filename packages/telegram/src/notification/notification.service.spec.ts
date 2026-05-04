import { NotificationService } from './notification.service';
import axios from 'axios';

jest.mock('axios');

describe('NotificationService', () => {
  // Проверяет, что сервис считает Telegram настроенным при наличии токена и chat id
  it('reports configured status when token and chat id are available', () => {
    const configService = {
      get: jest.fn((key: string) => (key === 'TELEGRAM_BOT_TOKEN' ? 'token' : key === 'TELEGRAM_CHAT_ID' ? 'chatid' : '')),
    } as any;

    const service = new NotificationService(configService);
    expect(service.getStatus()).toEqual({ status: 'ok', telegramConfigured: true });
  });

  // Проверяет, что при отсутствии конфигурации возвращается ошибка
  it('returns a configuration error when Telegram settings are missing', async () => {
    const configService = { get: jest.fn().mockReturnValue('') } as any;
    const service = new NotificationService(configService);

    const result = await service.sendTelegramMessage({ eventId: 'evt-1', text: 'test', payload: {} } as any);
    expect(result).toEqual({ ok: false, reason: 'Telegram configuration missing' });
    expect(axios.post).not.toHaveBeenCalled();
  });
});
