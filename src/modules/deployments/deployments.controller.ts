import {
  ApiTags,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { DeploymentDto, DeploymentImageDto } from './dto/deployment.dto';
import { TransformInterceptor } from './../../interceptors/transform.interceptor';
import { FindOneParams } from './../../utils/find-one-params';
import { JwtAuthenticationGuard } from '../authentication/guards/jwt-authentication.guard';
import { WorkspaceInterceptor } from './../../interceptors/workspace.interceptor';
import { UserDocument } from '../users/schemas/user.schema';
import { WorkspaceDocument } from './../workspaces/schemas/workspace.schema';
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { Workspace } from '../../decorators/workspace.decorator';
import { DeploymentsService } from './deployments.service';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { UpdateDeploymentDto } from './dto/update-deployment.dto';
import { User } from '../../decorators/user.decorator';
import {
  DeploymentDocument,
  DeploymentImage,
} from './schemas/deployment.schema';

@ApiCookieAuth()
@ApiTags('Deployments')
@UseGuards(JwtAuthenticationGuard)
@Controller('api/workspaces/:workspaceId/deployments')
@UseInterceptors(WorkspaceInterceptor, new TransformInterceptor(DeploymentDto))
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  /**
   * Create a new deployment
   * @param user the user
   * @param workspace the workspace
   * @param createDeploymentDto the deployment to create
   */
  @Post()
  @ApiCreatedResponse({
    description: 'The deployment has been successfully created',
    type: DeploymentDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided deployment is not valid',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description: 'The workspace with the given id was not found',
  })
  create(
    @User() user: UserDocument,
    @Workspace() workspace: WorkspaceDocument,
    @Body() createDeploymentDto: CreateDeploymentDto,
  ): Promise<DeploymentDocument> {
    return this.deploymentsService.create(user, workspace, createDeploymentDto);
  }

  /**
   * Get all allowed deployment images
   */
  @Get('images')
  @ApiOkResponse({
    description: 'The deployment images have been successfully retrieved',
    type: DeploymentImageDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description: 'The workspace with the given id was not found',
  })
  findAllImages(): DeploymentImage[] {
    return this.deploymentsService.findAllImages();
  }

  /**
   * Get all deployments
   * @param userId the users id
   * @param workspaceId the workspace id
   */
  @Get()
  @ApiOkResponse({
    description: 'The deployments have been successfully retrieved',
    type: [DeploymentDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description: 'The workspace with the given id was not found',
  })
  findAll(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
  ): Promise<DeploymentDocument[]> {
    return this.deploymentsService.findAll(workspaceId, userId);
  }

  /**
   * Get a deployment
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param deploymentId the deployment id
   */
  @Get(':id')
  @ApiOkResponse({
    description: 'The deployment has been successfully retrieved',
    type: DeploymentDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description: 'The workspace or deployment with the given id was not found',
  })
  findOne(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Param() { id: deploymentId }: FindOneParams,
  ): Promise<DeploymentDocument> {
    return this.deploymentsService.findOne(deploymentId, userId, workspaceId);
  }

  /**
   * Update a deployment
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param deploymentId the deployment id
   * @param updateDeploymentDto the updated deployment
   */
  @Put(':id')
  @ApiOkResponse({
    description: 'The deployment has been successfully updated',
    type: DeploymentDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided deployment is not valid',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description: 'The workspace or deployment with the given id was not found',
  })
  update(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Param() { id: deploymentId }: FindOneParams,
    @Body() updateDeploymentDto: UpdateDeploymentDto,
  ): Promise<DeploymentDocument> {
    return this.deploymentsService.update(
      userId,
      workspaceId,
      deploymentId,
      updateDeploymentDto,
    );
  }

  /**
   * Delete a deployment
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param deploymentId the deployment id
   */
  @Delete(':id')
  @ApiOkResponse({
    description: 'The deployment has been successfully deleted',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description: 'The workspace or deployment with the given id was not found',
  })
  remove(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Param() { id: deploymentId }: FindOneParams,
  ): Promise<void> {
    return this.deploymentsService.remove(userId, workspaceId, deploymentId);
  }
}
