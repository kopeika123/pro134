import { ConsumerService } from './consumer.service';

describe('ConsumerService', () => {
  let service: ConsumerService;
  const configService = { get: jest.fn((key: string) => (key === 'RABBITMQ_URL' ? 'amqp://guest:guest@rabbitmq:5672' : 'http://telegram-service:3003')) } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ConsumerService(configService);
    service['channel'] = { ack: jest.fn(), sendToQueue: jest.fn() } as any;
  });

  // Проверяет, что дубликаты сообщений пропускаются и не обрабатываются второй раз
  it('skips duplicate event processing', async () => {
    const message = {
      content: Buffer.from(JSON.stringify({ eventId: 'evt-1', payload: { foo: 'bar' } })),
      properties: { headers: {} },
      fields: {},
    } as any;

    const processSpy = jest.spyOn(service as any, 'processEvent').mockResolvedValue(undefined);

    await (service as any).handleMessage(message);
    await (service as any).handleMessage(message);

    expect(processSpy).toHaveBeenCalledTimes(1);
    expect((service['channel'] as any).ack).toHaveBeenCalledTimes(2);
  });
});
