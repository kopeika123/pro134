import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.ConfirmChannel | null = null;
  private readonly queue = 'events_queue';

  constructor(private readonly configService: ConfigService) {}

  // Выполняется при старте модуля и устанавливает соединение с RabbitMQ
  async onModuleInit() {
    await this.connectWithRetry();
  }

  // Закрывает соединение и канал при остановке модуля
  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }

  // Публикует событие в RabbitMQ и возвращает идентификатор события
  async publishEvent(payload: Record<string, unknown>) {
    if (!this.channel) {
      await this.connectWithRetry();
    }

    const eventId = uuidv4();
    const message = { eventId, payload, timestamp: new Date().toISOString() };

    await this.publishWithRetry(message);

    return { eventId, status: 'sent' };
  }

  // Возвращает текущее состояние подключения и очередь
  getStatus() {
    return {
      status: this.channel ? 'connected' : 'initializing',
      queue: this.queue,
    };
  }

  // Пытается подключиться к RabbitMQ с повторными попытками при ошибке
  private async connectWithRetry(attempt = 1): Promise<void> {
    const url = this.configService.get<string>('RABBITMQ_URL', 'amqp://guest:guest@rabbitmq:5672');

    try {
      this.logger.log(`Attempting to connect to RabbitMQ (attempt ${attempt})`);
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createConfirmChannel();
      await this.channel.assertQueue(this.queue, { durable: true });
      this.channel.on('error', () => {
        this.logger.warn('RabbitMQ channel error, resetting channel');
        this.channel = null;
      });
      this.connection.on('error', () => {
        this.logger.warn('RabbitMQ connection error, resetting connection');
        this.connection = null;
      });
      this.logger.log('Connected to RabbitMQ successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`RabbitMQ connect attempt ${attempt} failed: ${message}`);
      const delay = Math.min(attempt * 1000, 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.connectWithRetry(attempt + 1);
    }
  }

  // Публикует сообщение в очередь RabbitMQ с повторными попытками при сбое
  private async publishWithRetry(message: Record<string, unknown>, attempt = 1): Promise<void> {
    if (!this.channel) {
      await this.connectWithRetry();
    }
    try {
      const body = Buffer.from(JSON.stringify(message));
      this.channel!.sendToQueue(this.queue, body, {
        persistent: true,
        messageId: String(message['eventId'])
      });
      await this.channel!.waitForConfirms();
      console.log(`Message published: ${message['eventId']}`);
    } catch (error) {
      console.error(`Publish attempt ${attempt} failed`, error instanceof Error ? error.message : error);
      if (attempt < 5) {
        const nextDelay = attempt * 500;
        await new Promise((resolve) => setTimeout(resolve, nextDelay));
        return this.publishWithRetry(message, attempt + 1);
      }
      throw error;
    }
  }
}
