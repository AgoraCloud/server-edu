import { Action } from './../authorization/schemas/permission.schema';
import { Auth } from '../../decorators/auth.decorator';
import { KubernetesPodsService } from './kubernetes-pods.service';
import { WorkspaceDocument } from './../workspaces/schemas/workspace.schema';
import { ExceptionDto } from './../../utils/base.dto';
import {
  ApiTags,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
  ApiOperation,
  ApiParam,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { DeploymentInterceptor } from '../../interceptors/deployment.interceptor';
import { MetricsDto } from './dto/metrics.dto';
import { KubernetesService } from './kubernetes.service';
import { WorkspaceInterceptor } from '../../interceptors/workspace.interceptor';
import { Controller, UseInterceptors, Get, Param } from '@nestjs/common';
import { Workspace } from '../../decorators/workspace.decorator';
import { Permissions } from '../../decorators/permissions.decorator';

@ApiCookieAuth()
@Auth(Action.ReadWorkspace)
@UseInterceptors(WorkspaceInterceptor)
@Controller('api/workspaces/:workspaceId')
export class KubernetesController {
  constructor(
    private readonly kubernetesService: KubernetesService,
    private readonly kubernetesPodsService: KubernetesPodsService,
  ) {}

  /**
   * Get a deployments logs
   * @param workspaceId the workspace id
   * @param deploymentId the deployment id
   */
  @Get('deployments/:deploymentId/logs')
  @Permissions(Action.ReadDeployment)
  @UseInterceptors(DeploymentInterceptor)
  @ApiTags('Deployments')
  @ApiOperation({ summary: 'Get a deployments logs' })
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'deploymentId', description: 'The deployment id' })
  @ApiOkResponse({
    description: 'The deployment logs have been successfully retrieved',
    type: 'string',
  })
  @ApiBadRequestResponse({
    description: 'The provided workspace id or deployment id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace or deployment with the given id was not found',
    type: ExceptionDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Kubernetes pod for the given deployment did not exist',
    type: ExceptionDto,
  })
  findDeploymentLogs(
    @Param('workspaceId') workspaceId: string,
    @Param('deploymentId') deploymentId: string,
  ): Promise<string> {
    return this.kubernetesPodsService.getPodLogs(workspaceId, deploymentId);
  }

  /**
   * Get a deployments metrics (cpu and memory)
   * @param workspaceId the workspace id
   * @param deploymentId the deployment id
   */
  @Get('deployments/:deploymentId/metrics')
  @Permissions(Action.ReadDeployment)
  @UseInterceptors(DeploymentInterceptor)
  @ApiTags('Deployments')
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'deploymentId', description: 'The deployment id' })
  @ApiOperation({ summary: 'Get a deployments metrics (cpu and memory)' })
  @ApiOkResponse({
    description: 'The deployment metrics have been successfully retrieved',
    type: MetricsDto,
  })
  @ApiBadRequestResponse({
    description:
      'Kubernetes pod metrics for the given deployment were not available, the provided workspace id or deployment id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace or deployment with the given id was not found',
    type: ExceptionDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Kubernetes pod for the given deployment did not exist',
    type: ExceptionDto,
  })
  findDeploymentMetrics(
    @Param('workspaceId') workspaceId: string,
    @Param('deploymentId') deploymentId: string,
  ): Promise<MetricsDto> {
    return this.kubernetesPodsService.getPodMetrics(workspaceId, deploymentId);
  }

  /**
   * Get a workspaces metrics (cpu, memory and storage)
   * @param workspace the workspace
   */
  @Get('metrics')
  @ApiTags('Workspaces')
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiOperation({
    summary: 'Get a workspaces metrics (cpu, memory and storage)',
  })
  @ApiOkResponse({
    description: 'The workspace metrics have been successfully retrieved',
    type: MetricsDto,
  })
  @ApiBadRequestResponse({
    description:
      'Metrics for the given workspace were not available or the provided workspace id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace with the given id was not found',
    type: ExceptionDto,
  })
  findWorkspaceMetrics(
    @Workspace() workspace: WorkspaceDocument,
  ): Promise<MetricsDto> {
    return this.kubernetesService.getWorkspaceMetrics(workspace);
  }
}
