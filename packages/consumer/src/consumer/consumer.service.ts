import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import axios from 'axios';

@Injectable()
export class ConsumerService implements OnModuleInit {
  private readonly logger = new Logger(ConsumerService.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly queue = 'events_queue';
  private readonly maxRetries = 3;
  private readonly dedupeTtlMs = 5 * 60 * 1000;
  private readonly processedEventIds = new Map<string, number>();

  constructor(private readonly configService: ConfigService) {}

  // Выполняется при старте модуля и запускает процесс подключения к RabbitMQ
  async onModuleInit() {
    await this.initializeConsumer();
  }

  // Инициализирует подключение к RabbitMQ и настраивает потребителя очереди
  private async initializeConsumer(attempt = 1): Promise<void> {
    const url = this.configService.get<string>('RABBITMQ_URL', 'amqp://guest:guest@rabbitmq:5672');
    try {
      this.logger.log(`Attempting to connect to RabbitMQ (attempt ${attempt})`);
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.queue, { durable: true });
      await this.channel.consume(this.queue, (message: amqp.ConsumeMessage | null) => this.handleMessage(message), { noAck: false });
      this.connection.on('error', (error) => {
        this.logger.warn(`RabbitMQ connection error: ${error?.message}`);
        this.connection = null;
      });
      this.channel.on('error', (error) => {
        this.logger.warn(`RabbitMQ channel error: ${error?.message}`);
        this.channel = null;
      });
      this.logger.log('Connected to RabbitMQ and consuming queue');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`RabbitMQ connect failed: ${message}`);
      await new Promise((resolve) => setTimeout(resolve, Math.min(attempt * 1000, 10000)));
      return this.initializeConsumer(attempt + 1);
    }
  }

  // Удаляет устаревшие идентификаторы обработанных событий из кеша
  private cleanupProcessedEventIds(): void {
    const now = Date.now();
    for (const [eventId, expiry] of this.processedEventIds) {
      if (expiry <= now) {
        this.processedEventIds.delete(eventId);
      }
    }
  }

  // Проверяет, было ли событие уже обработано ранее
  private isDuplicate(eventId?: string): boolean {
    if (!eventId) {
      return false;
    }
    this.cleanupProcessedEventIds();
    if (this.processedEventIds.has(eventId)) {
      return true;
    }
    this.processedEventIds.set(eventId, Date.now() + this.dedupeTtlMs);
    return false;
  }

  // Обрабатывает сообщение из очереди RabbitMQ
  private async handleMessage(message: amqp.ConsumeMessage | null) {
    if (!message) {
      return;
    }

    const content = message.content.toString();
    const payload = JSON.parse(content);
    const retryCount = Number(message.properties.headers?.['x-retry'] ?? 0);

    if (this.isDuplicate(payload.eventId)) {
      this.logger.warn(`Duplicate message skipped: ${payload.eventId}`);
      this.channel?.ack(message);
      return;
    }

    try {
      await this.processEvent(payload);
      const channel = this.channel;
      if (!channel) {
        this.logger.error('Cannot acknowledge message because RabbitMQ channel is not available');
        return;
      }
      channel.ack(message);
      this.logger.log(`Message processed: ${payload.eventId}`);
    } catch (error) {
      this.logger.error(`Processing failed: ${error instanceof Error ? error.message : error}`);
      const channel = this.channel;
      if (!channel) {
        this.logger.error('Cannot acknowledge message because RabbitMQ channel is not available');
        return;
      }
      if (retryCount < this.maxRetries) {
        await this.requeueMessage(message, retryCount + 1);
        channel.ack(message);
        this.logger.warn(`Message requeued with retry ${retryCount + 1}`);
      } else {
        channel.ack(message);
        this.logger.error(`Message failed permanently after ${retryCount} retries: ${payload.eventId}`);
      }
    }
  }

  // Переотправляет сообщение в очередь с увеличенным счетчиком попыток
  private async requeueMessage(message: amqp.ConsumeMessage, retries: number) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not available for requeue');
    }
    const headers = { ...message.properties.headers, 'x-retry': retries };
    this.channel.sendToQueue(this.queue, message.content, {
      persistent: true,
      headers,
    });
  }

  // Отправляет данные события в Telegram сервис
  private async processEvent(payload: any) {
    const telegramUrl = this.configService.get<string>('TELEGRAM_SERVICE_URL', 'http://telegram-service:3003');
    const text = `Event ${payload.eventId} received with payload: ${JSON.stringify(payload.payload)}`;

    await axios.post(
      `${telegramUrl}/notifications`,
      {
        eventId: payload.eventId,
        text,
        payload: payload.payload,
      },
      {
        timeout: 5000,
      },
    );
  }

  // Возвращает текущее состояние consumer сервиса
  getStatus() {
    return {
      status: this.channel ? 'connected' : 'initializing',
      queue: this.queue,
      retries: this.maxRetries,
      processedEvents: this.processedEventIds.size,
    };
  }
}
