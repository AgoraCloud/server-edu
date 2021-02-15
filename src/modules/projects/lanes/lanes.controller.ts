import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { FindOneParams } from './../../../utils/find-one-params';
import { ProjectDocument } from './../schemas/project.schema';
import { WorkspaceDocument } from './../../workspaces/schemas/workspace.schema';
import { UserDocument } from './../../users/schemas/user.schema';
import { TransformInterceptor } from './../../../interceptors/transform.interceptor';
import { ProjectInterceptor } from './../../../interceptors/project.interceptor';
import { WorkspaceInterceptor } from './../../../interceptors/workspace.interceptor';
import { JwtAuthenticationGuard } from './../../authentication/guards/jwt-authentication.guard';
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProjectLanesService } from './lanes.service';
import { CreateProjectLaneDto } from './dto/create-lane.dto';
import { UpdateProjectLaneDto } from './dto/update-lane.dto';
import { ProjectLaneDto } from './dto/lane.dto';
import { User } from '../../../decorators/user.decorator';
import { Workspace } from '../../../decorators/workspace.decorator';
import { Project } from '../../../decorators/project.decorator';
import { ProjectLaneDocument } from './schemas/lane.schema';

@ApiCookieAuth()
@ApiTags('Project Lanes')
@UseGuards(JwtAuthenticationGuard)
@Controller('api/workspaces/:workspaceId/projects/:projectId/lanes')
@UseInterceptors(
  WorkspaceInterceptor,
  ProjectInterceptor,
  new TransformInterceptor(ProjectLaneDto),
)
export class ProjectLanesController {
  constructor(private readonly projectLanesService: ProjectLanesService) {}

  @Post()
  create(
    @User() user: UserDocument,
    @Workspace() workspace: WorkspaceDocument,
    @Project() project: ProjectDocument,
    @Body() createProjectLaneDto: CreateProjectLaneDto,
  ): Promise<ProjectLaneDocument> {
    return this.projectLanesService.create(
      user,
      workspace,
      project,
      createProjectLaneDto,
    );
  }

  @Get()
  findAll(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Project('_id') projectId: string,
  ): Promise<ProjectLaneDocument[]> {
    return this.projectLanesService.findAll(projectId, userId, workspaceId);
  }

  @Get(':id')
  findOne(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Project('_id') projectId: string,
    @Param() { id }: FindOneParams,
  ): Promise<ProjectLaneDocument> {
    return this.projectLanesService.findOne(userId, workspaceId, projectId, id);
  }

  @Put(':id')
  update(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Project('_id') projectId: string,
    @Param() { id }: FindOneParams,
    @Body() updateProjectLaneDto: UpdateProjectLaneDto,
  ): Promise<ProjectLaneDocument> {
    return this.projectLanesService.update(
      userId,
      workspaceId,
      projectId,
      id,
      updateProjectLaneDto,
    );
  }

  @Delete(':id')
  remove(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Project('_id') projectId: string,
    @Param() { id }: FindOneParams,
  ): Promise<void> {
    return this.projectLanesService.remove(userId, workspaceId, projectId, id);
  }
}
