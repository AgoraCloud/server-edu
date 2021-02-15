import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { DeploymentInterceptor } from '../../interceptors/deployment.interceptor';
import { DeploymentMetricsDto } from './dto/deployment-metrics.dto';
import { KubernetesService } from './kubernetes.service';
import { WorkspaceInterceptor } from '../../interceptors/workspace.interceptor';
import { JwtAuthenticationGuard } from '../authentication/guards/jwt-authentication.guard';
import {
  Controller,
  UseGuards,
  UseInterceptors,
  Get,
  Param,
} from '@nestjs/common';

@ApiCookieAuth()
@ApiTags('Deployments')
@UseGuards(JwtAuthenticationGuard)
@UseInterceptors(WorkspaceInterceptor, DeploymentInterceptor)
@Controller('api/workspaces/:workspaceId/deployments/:deploymentId')
export class KubernetesController {
  constructor(private readonly kubernetesService: KubernetesService) {}

  /**
   * Get a deployments logs
   * @param workspaceId the workspace id
   * @param deploymentId the deployment id
   */
  @Get('logs')
  findOneLogs(
    @Param('workspaceId') workspaceId: string,
    @Param('deploymentId') deploymentId: string,
  ): Promise<string> {
    return this.kubernetesService.getPodLogs(workspaceId, deploymentId);
  }

  /**
   * Get a deployments metrics (cpu and memory)
   * @param workspaceId the workspace id
   * @param deploymentId the deployment id
   */
  @Get('metrics')
  findOneMetrics(
    @Param('workspaceId') workspaceId: string,
    @Param('deploymentId') deploymentId: string,
  ): Promise<DeploymentMetricsDto> {
    return this.kubernetesService.getPodMetrics(workspaceId, deploymentId);
  }
}
