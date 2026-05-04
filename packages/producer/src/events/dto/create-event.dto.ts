import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({
    description: 'Произвольное полезное содержимое события',
    example: {
      orderId: 'order-98765',
      userId: 'user-12345',
      amount: 1290.5,
      status: 'created',
    },
  })
  @IsNotEmpty()
  @IsObject()
  readonly payload!: Record<string, unknown>;
}
