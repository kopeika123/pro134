import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class SendNotificationDto {
  @ApiProperty({
    description: 'Уникальный идентификатор события',
    example: 'event-12345',
  })
  @IsString()
  @IsNotEmpty()
  readonly eventId!: string;

  @ApiProperty({
    description: 'Текст сообщения для Telegram',
    example: 'Новое событие: заказ создан',
  })
  @IsString()
  @IsNotEmpty()
  readonly text!: string;

  @ApiProperty({
    description: 'Дополнительные данные события',
    type: Object,
    example: {
      orderId: 'order-98765',
      userName: 'Иван Иванов',
      amount: 1290.5,
      status: 'created',
    },
  })
  @IsObject()
  readonly payload!: Record<string, unknown>;
}
