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

@UseGuards(JwtAuthenticationGuard)
@UseInterceptors(WorkspaceInterceptor)
@Controller('api/workspaces/:workspaceId/deployments')
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Post()
  create(
    @User() user: UserDocument,
    @Workspace() workspace: WorkspaceDocument,
    @Body() createDeploymentDto: CreateDeploymentDto,
  ): Promise<DeploymentDocument> {
    return this.deploymentsService.create(user, workspace, createDeploymentDto);
  }

  @Get('images')
  findAllImages(): DeploymentImage[] {
    return this.deploymentsService.findAllImages();
  }

  @Get()
  findAll(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
  ): Promise<DeploymentDocument[]> {
    return this.deploymentsService.findAll(workspaceId, userId);
  }

  @Get(':id')
  findOne(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Param() { id }: FindOneParams,
  ): Promise<DeploymentDocument> {
    return this.deploymentsService.findOne(id, userId, workspaceId);
  }

  @Put(':id')
  update(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Param() { id }: FindOneParams,
    @Body() updateDeploymentDto: UpdateDeploymentDto,
  ): Promise<DeploymentDocument> {
    return this.deploymentsService.update(
      userId,
      workspaceId,
      id,
      updateDeploymentDto,
    );
  }

  @Delete(':id')
  remove(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Param() { id }: FindOneParams,
  ): Promise<void> {
    return this.deploymentsService.remove(userId, workspaceId, id);
  }
}
