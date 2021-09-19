import { HealthService } from './health.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckResult } from '@nestjs/terminus';

@ApiTags('Health')
@Controller('api/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Get the readiness state of the server
   */
  @HealthCheck()
  @Get('readiness')
  @ApiOperation({ summary: 'Get the readiness state of the server' })
  readinessCheck(): Promise<HealthCheckResult> {
    return this.healthService.check();
  }

  /**
   * Get the liveness state of the server
   */
  @HealthCheck()
  @Get('liveness')
  @ApiOperation({ summary: 'Get the liveness state of the server' })
  livenessCheck(): Promise<HealthCheckResult> {
    return this.healthService.check();
  }
}
