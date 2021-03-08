import { IsAdmin } from '../../../decorators/is-admin.decorator';
import { Permissions } from './../../../decorators/permissions.decorator';
import { Auth } from '../../../decorators/auth.decorator';
import { Action } from './../../authorization/schemas/permission.schema';
import { ExceptionDto } from './../../../utils/base.dto';
import {
  ApiTags,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiOperation,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
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
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
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
@Auth(Action.ReadWorkspace, Action.ReadProject, Action.ReadProjectLane)
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
  @Permissions(Action.CreateProjectTask)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'projectId', description: 'The project id' })
  @ApiParam({ name: 'laneId', description: 'The project lane id' })
  @ApiOperation({ summary: 'Create a new project task' })
  @ApiCreatedResponse({
    description: 'The project task has been successfully created',
    type: ProjectTaskDto,
  })
  @ApiBadRequestResponse({
    description:
      'The provided project task, workspace id, project id or lane id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description:
      'The workspace, project or project lane with the given id was not found',
    type: ExceptionDto,
  })
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
  @Permissions(Action.ReadProjectTask)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'projectId', description: 'The project id' })
  @ApiParam({ name: 'laneId', description: 'The project lane id' })
  @ApiOperation({ summary: 'Get all project tasks' })
  @ApiOkResponse({
    description: 'The project tasks have been successfully retrieved',
    type: [ProjectTaskDto],
  })
  @ApiBadRequestResponse({
    description:
      'The provided workspace id, project id or lane id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description:
      'The workspace, project or project lane with the given id was not found',
    type: ExceptionDto,
  })
  findAll(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Workspace('_id') workspaceId: string,
    @Project('_id') projectId: string,
    @ProjectLane('_id') projectLaneId: string,
  ): Promise<ProjectTaskDocument[]> {
    if (isAdmin) {
      return this.projectTasksService.findAll(
        projectLaneId,
        undefined,
        workspaceId,
        projectId,
      );
    }
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
  @Permissions(Action.ReadProjectTask)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'projectId', description: 'The project id' })
  @ApiParam({ name: 'laneId', description: 'The project lane id' })
  @ApiParam({ name: 'id', description: 'The project task id' })
  @ApiOperation({ summary: 'Get a project task' })
  @ApiOkResponse({
    description: 'The project task has been successfully retrieved',
    type: ProjectTaskDto,
  })
  @ApiBadRequestResponse({
    description:
      'The provided workspace id, project id, lane id or task id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description:
      'The workspace, project, project lane or project task with the given id was not found',
    type: ExceptionDto,
  })
  findOne(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Workspace('_id') workspaceId: string,
    @Project('_id') projectId: string,
    @ProjectLane('_id') projectLaneId: string,
    @Param() { id: projectTaskId }: FindOneParams,
  ): Promise<ProjectTaskDocument> {
    if (isAdmin) {
      return this.projectTasksService.findOne(
        workspaceId,
        projectId,
        projectLaneId,
        projectTaskId,
      );
    }
    return this.projectTasksService.findOne(
      workspaceId,
      projectId,
      projectLaneId,
      projectTaskId,
      userId,
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
  @Permissions(Action.UpdateProjectTask)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'projectId', description: 'The project id' })
  @ApiParam({ name: 'laneId', description: 'The project lane id' })
  @ApiParam({ name: 'id', description: 'The project task id' })
  @ApiOperation({ summary: 'Update a project task' })
  @ApiOkResponse({
    description: 'The project task has been successfully updated',
    type: ProjectTaskDto,
  })
  @ApiBadRequestResponse({
    description:
      'The provided project task, workspace id, project id, lane id or task id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description:
      'The workspace, project, project lane or project task with the given id was not found',
    type: ExceptionDto,
  })
  update(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Workspace('_id') workspaceId: string,
    @Project('_id') projectId: string,
    @ProjectLane('_id') projectLaneId: string,
    @Param() { id: projectTaskId }: FindOneParams,
    @Body() updateProjectTaskDto: UpdateProjectTaskDto,
  ): Promise<ProjectTaskDocument> {
    if (isAdmin) {
      return this.projectTasksService.update(
        workspaceId,
        projectId,
        projectLaneId,
        projectTaskId,
        updateProjectTaskDto,
      );
    }
    return this.projectTasksService.update(
      workspaceId,
      projectId,
      projectLaneId,
      projectTaskId,
      updateProjectTaskDto,
      userId,
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
  @Permissions(Action.DeleteProjectTask)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'projectId', description: 'The project id' })
  @ApiParam({ name: 'laneId', description: 'The project lane id' })
  @ApiParam({ name: 'id', description: 'The project task id' })
  @ApiOperation({ summary: 'Delete a project task' })
  @ApiOkResponse({
    description: 'The project task has been successfully deleted',
  })
  @ApiBadRequestResponse({
    description:
      'The provided workspace id, project id, lane id or task id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description:
      'The workspace, project, project lane or project task with the given id was not found',
    type: ExceptionDto,
  })
  remove(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Workspace('_id') workspaceId: string,
    @Project('_id') projectId: string,
    @ProjectLane('_id') projectLaneId: string,
    @Param() { id: projectTaskId }: FindOneParams,
  ): Promise<void> {
    if (isAdmin) {
      return this.projectTasksService.remove(
        workspaceId,
        projectId,
        projectLaneId,
        projectTaskId,
      );
    }
    return this.projectTasksService.remove(
      workspaceId,
      projectId,
      projectLaneId,
      projectTaskId,
      userId,
    );
  }
}
