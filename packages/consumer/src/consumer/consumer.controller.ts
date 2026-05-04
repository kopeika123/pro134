import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConsumerService } from './consumer.service';

@ApiTags('consumer')
@Controller()
export class ConsumerController {
  constructor(private readonly consumerService: ConsumerService) {}

  @Get('health')
  @ApiOperation({ summary: 'Состояние' })
  getHealth() {
    return this.consumerService.getStatus();
  }
}
