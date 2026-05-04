import { EventsService } from './events.service';
import * as amqp from 'amqplib';

jest.mock('amqplib');

describe('EventsService', () => {
  let service: EventsService;
  const configService = { get: jest.fn().mockReturnValue('amqp://guest:guest@rabbitmq:5672') } as any;
  const assertQueue = jest.fn().mockResolvedValue(undefined);
  const sendToQueue = jest.fn().mockReturnValue(true);
  const waitForConfirms = jest.fn().mockResolvedValue(undefined);
  const channel = { assertQueue, on: jest.fn(), sendToQueue, waitForConfirms } as any;
  const connection = { createConfirmChannel: jest.fn().mockResolvedValue(channel), on: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EventsService(configService);
    jest.spyOn(amqp, 'connect').mockResolvedValue(connection as any);
  });

  // Проверяет публикацию события и ожидание подтверждения от RabbitMQ
  it('publishes an event and waits for confirms', async () => {
    await service.onModuleInit();
    const result = await service.publishEvent({ name: 'test' });

    expect(result).toHaveProperty('eventId');
    expect(result.status).toBe('sent');
    expect(assertQueue).toHaveBeenCalledWith('events_queue', { durable: true });
    expect(sendToQueue).toHaveBeenCalled();
    expect(waitForConfirms).toHaveBeenCalled();
  });
});
