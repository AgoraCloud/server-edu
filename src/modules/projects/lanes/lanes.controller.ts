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

  /**
   * Create a project lane
   * @param user the user
   * @param workspace the workspace
   * @param project the project
   * @param createProjectLaneDto the project lane to create
   */
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

  /**
   * Get all project lanes
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param projectId the project id
   */
  @Get()
  findAll(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Project('_id') projectId: string,
  ): Promise<ProjectLaneDocument[]> {
    return this.projectLanesService.findAll(projectId, userId, workspaceId);
  }

  /**
   * Get a project lane
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param projectId the project id
   * @param projectLaneId the project lane id
   */
  @Get(':id')
  findOne(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Project('_id') projectId: string,
    @Param() { id: projectLaneId }: FindOneParams,
  ): Promise<ProjectLaneDocument> {
    return this.projectLanesService.findOne(
      userId,
      workspaceId,
      projectId,
      projectLaneId,
    );
  }

  /**
   * Update a project lane
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param projectId the project id
   * @param projectLaneId the project lane id
   * @param updateProjectLaneDto the updated project lane
   */
  @Put(':id')
  update(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Project('_id') projectId: string,
    @Param() { id: projectLaneId }: FindOneParams,
    @Body() updateProjectLaneDto: UpdateProjectLaneDto,
  ): Promise<ProjectLaneDocument> {
    return this.projectLanesService.update(
      userId,
      workspaceId,
      projectId,
      projectLaneId,
      updateProjectLaneDto,
    );
  }

  /**
   * Delete a project lane
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param projectId the project id
   * @param projectLaneId the project lane id
   */
  @Delete(':id')
  remove(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Project('_id') projectId: string,
    @Param() { id: projectLaneId }: FindOneParams,
  ): Promise<void> {
    return this.projectLanesService.remove(
      userId,
      workspaceId,
      projectId,
      projectLaneId,
    );
  }
}
