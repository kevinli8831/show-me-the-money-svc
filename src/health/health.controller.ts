import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { formatSuccessResponse } from '../common/helpers';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) { }

  @Get()
  healthCheck() {
    const result = this.healthService.healthCheck();
    return formatSuccessResponse(result, 'Health check successful');
  }
}
