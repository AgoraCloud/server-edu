import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { FindOneParams } from './../../../utils/find-one-params';
import { ProjectLaneDocument } from './../lanes/schemas/lane.schema';
import { ProjectDocument } from './../schemas/project.schema';
import { WorkspaceDocument } from './../../workspaces/schemas/workspace.schema';
import { UserDocument } from './../../users/schemas/user.schema';
import { ProjectTaskDocument } from './schemas/task.schema';
import { TransformInterceptor } from './../../../interceptors/transform.interceptor';
import { ProjectTaskDto } from './dto/task.dto';
import { ProjectLaneInterceptor } from './../../../interceptors/project-lane.interceptor';
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
import { ProjectTasksService } from './tasks.service';
import { CreateProjectTaskDto } from './dto/create-task.dto';
import { UpdateProjectTaskDto } from './dto/update-task.dto';
import { User } from '../../../decorators/user.decorator';
import { Workspace } from '../../../decorators/workspace.decorator';
import { Project } from '../../../decorators/project.decorator';
import { ProjectLane } from '../../../decorators/project-lane.decorator';

@ApiCookieAuth()
@ApiTags('Project Tasks')
@UseGuards(JwtAuthenticationGuard)
@Controller(
  'api/workspaces/:workspaceId/projects/:projectId/lanes/:laneId/tasks',
)
@UseInterceptors(
  WorkspaceInterceptor,
  ProjectInterceptor,
  ProjectLaneInterceptor,
  new TransformInterceptor(ProjectTaskDto),
)
export class ProjectTasksController {
  constructor(private readonly projectTasksService: ProjectTasksService) {}

  /**
   * Create a new project task
   * @param user the user
   * @param workspace the workspace
   * @param project the project
   * @param projectLane the project lane
   * @param createProjectTaskDto the project task to create
   */
  @Post()
  create(
    @User() user: UserDocument,
    @Workspace() workspace: WorkspaceDocument,
    @Project() project: ProjectDocument,
    @ProjectLane() projectLane: ProjectLaneDocument,
    @Body() createProjectTaskDto: CreateProjectTaskDto,
  ): Promise<ProjectTaskDocument> {
    return this.projectTasksService.create(
      user,
      workspace,
      project,
      projectLane,
      createProjectTaskDto,
    );
  }

  /**
   * Get all project tasks
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param projectId the project id
   * @param projectLaneId the project lane id
   */
  @Get()
  findAll(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Project('_id') projectId: string,
    @ProjectLane('_id') projectLaneId: string,
  ): Promise<ProjectTaskDocument[]> {
    return this.projectTasksService.findAll(
      projectLaneId,
      userId,
      workspaceId,
      projectId,
    );
  }

  /**
   * Get a project task
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param projectId the project id
   * @param projectLaneId the project lane id
   * @param projectTaskId the project task id
   */
  @Get(':id')
  findOne(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Project('_id') projectId: string,
    @ProjectLane('_id') projectLaneId: string,
    @Param() { id: projectTaskId }: FindOneParams,
  ): Promise<ProjectTaskDocument> {
    return this.projectTasksService.findOne(
      userId,
      workspaceId,
      projectId,
      projectLaneId,
      projectTaskId,
    );
  }

  /**
   * Update a project task
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param projectId the project id
   * @param projectLaneId the project lane id
   * @param projectTaskId the project task id
   * @param updateProjectTaskDto the updated project task
   */
  @Put(':id')
  update(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Project('_id') projectId: string,
    @ProjectLane('_id') projectLaneId: string,
    @Param() { id: projectTaskId }: FindOneParams,
    @Body() updateProjectTaskDto: UpdateProjectTaskDto,
  ): Promise<ProjectTaskDocument> {
    return this.projectTasksService.update(
      userId,
      workspaceId,
      projectId,
      projectLaneId,
      projectTaskId,
      updateProjectTaskDto,
    );
  }

  /**
   * Delete a project task
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param projectId the project id
   * @param projectLaneId the project lane id
   * @param projectTaskId the project task id
   */
  @Delete(':id')
  remove(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Project('_id') projectId: string,
    @ProjectLane('_id') projectLaneId: string,
    @Param() { id: projectTaskId }: FindOneParams,
  ): Promise<void> {
    return this.projectTasksService.remove(
      userId,
      workspaceId,
      projectId,
      projectLaneId,
      projectTaskId,
    );
  }
}
