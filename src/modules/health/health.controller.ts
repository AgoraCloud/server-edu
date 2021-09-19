import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  MemoryHealthIndicator,
  MongooseHealthIndicator,
} from '@nestjs/terminus';

@Controller('api/health')
@ApiTags('Health')
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly mongooseHealthIndicator: MongooseHealthIndicator,
    private readonly memoryHealthIndicator: MemoryHealthIndicator,
  ) {}

  /**
   * Get the readiness state of the server
   */
  @HealthCheck()
  @Get('readiness')
  @ApiOperation({ summary: 'Get the readiness state of the server' })
  readinessCheck(): Promise<HealthCheckResult> {
    return this.healthCheck();
  }

  /**
   * Get the liveness state of the server
   */
  @HealthCheck()
  @Get('liveness')
  @ApiOperation({ summary: 'Get the liveness state of the server' })
  livenessCheck(): Promise<HealthCheckResult> {
    return this.healthCheck();
  }

  /**
   * Checks if the server is healthy
   */
  private async healthCheck(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([
      async () => this.mongooseHealthIndicator.pingCheck('mongodb'),
      async () =>
        this.memoryHealthIndicator.checkHeap('memoryHeap', 300 * 1024 * 1024),
      async () =>
        this.memoryHealthIndicator.checkRSS('memoryRss', 300 * 1024 * 1024),
    ]);
  }
}
