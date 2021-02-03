import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  MemoryHealthIndicator,
  MongooseHealthIndicator,
} from '@nestjs/terminus';

@Controller('api/health')
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly mongooseHealthIndicator: MongooseHealthIndicator,
    private readonly memoryHealthIndicator: MemoryHealthIndicator,
  ) {}

  @HealthCheck()
  @Get(['readiness', 'liveness'])
  healthCheck(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([
      async () => this.mongooseHealthIndicator.pingCheck('mongodb'),
      async () =>
        this.memoryHealthIndicator.checkHeap('memoryHeap', 300 * 1024 * 1024),
      async () =>
        this.memoryHealthIndicator.checkRSS('memoryRss', 300 * 1024 * 1024),
    ]);
  }
}
