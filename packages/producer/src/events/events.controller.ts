import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Обрабатывает и отправляет событие в очередь' })
  async sendEvent(@Body() dto: CreateEventDto) {
    return this.eventsService.publishEvent(dto.payload);
  }

  @Get('health')
  @ApiOperation({ summary: 'Возвращает статус Producer сервиса' })
  getHealth() {
    return this.eventsService.getStatus();
  }
}
