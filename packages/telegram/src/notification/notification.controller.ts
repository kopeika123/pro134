import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { SendNotificationDto } from './dto/send-notification.dto';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Обрабатывает апрос на отправку уведомления в Telegram' })
  async send(@Body() dto: SendNotificationDto) {
    return this.notificationService.sendTelegramMessage(dto);
  }

  @Get('health')
  @ApiOperation({ summary: 'Возвращает состояние Telegram сервиса' })
  getHealth() {
    return this.notificationService.getStatus();
  }
}
