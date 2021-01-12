import { DeploymentInterceptor } from './../../interceptors/deployment.interceptor';
import { DeploymentMetricsDto } from './dto/deployment-metrics.dto';
import { KubernetesClientService } from './kubernetes-client.service';
import { WorkspaceInterceptor } from './../../interceptors/workspace.interceptor';
import { JwtAuthenticationGuard } from '../authentication/guards/jwt-authentication.guard';
import {
  Controller,
  UseGuards,
  UseInterceptors,
  Get,
  Param,
} from '@nestjs/common';

@UseGuards(JwtAuthenticationGuard)
@UseInterceptors(WorkspaceInterceptor, DeploymentInterceptor)
@Controller('api/workspaces/:workspaceId/deployments/:deploymentId')
export class KubernetesClientController {
  constructor(
    private readonly kubernetesClientService: KubernetesClientService,
  ) {}

  @Get('logs')
  findOneLogs(@Param('deploymentId') deploymentId: string): Promise<string> {
    return this.kubernetesClientService.getPodLogs(deploymentId);
  }

  @Get('metrics')
  findOneMetrics(
    @Param('deploymentId') deploymentId: string,
  ): Promise<DeploymentMetricsDto> {
    return this.kubernetesClientService.getPodMetrics(deploymentId);
  }
}
