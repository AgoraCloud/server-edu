import { IsAdmin } from '../../../decorators/is-admin.decorator';
import { Permissions } from '../../../decorators/permissions.decorator';
import { Action } from './../../authorization/schemas/permission.schema';
import { Auth } from '../../../decorators/auth.decorator';
import { ExceptionDto } from './../../../utils/base.dto';
import {
  ApiTags,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiOperation,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { FindOneParams } from './../../../utils/find-one-params';
import { ProjectDocument } from './../schemas/project.schema';
import { WorkspaceDocument } from './../../workspaces/schemas/workspace.schema';
import { UserDocument } from './../../users/schemas/user.schema';
import { TransformInterceptor } from './../../../interceptors/transform.interceptor';
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
@Auth(Action.ReadWorkspace, Action.ReadProject)
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
  @Permissions(Action.CreateProjectLane)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'projectId', description: 'The project id' })
  @ApiOperation({ summary: 'Create a project lane' })
  @ApiCreatedResponse({
    description: 'The project lane has been successfully created',
    type: ProjectLaneDto,
  })
  @ApiBadRequestResponse({
    description:
      'The provided project lane, workspace id or project id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace or project with the given id was not found',
    type: ExceptionDto,
  })
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
  @Permissions(Action.ReadProjectLane)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'projectId', description: 'The project id' })
  @ApiOperation({ summary: 'Get all project lanes' })
  @ApiOkResponse({
    description: 'The project lanes have been successfully retrieved',
    type: [ProjectLaneDto],
  })
  @ApiBadRequestResponse({
    description: 'The provided workspace id or project id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace or project with the given id was not found',
    type: ExceptionDto,
  })
  findAll(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Workspace('_id') workspaceId: string,
    @Project('_id') projectId: string,
  ): Promise<ProjectLaneDocument[]> {
    if (isAdmin) {
      return this.projectLanesService.findAll(
        projectId,
        undefined,
        workspaceId,
      );
    }
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
  @Permissions(Action.ReadProjectLane)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'projectId', description: 'The project id' })
  @ApiParam({ name: 'id', description: 'The project lane id' })
  @ApiOperation({ summary: 'Get a project lane' })
  @ApiOkResponse({
    description: 'The project lane has been successfully retrieved',
    type: ProjectLaneDto,
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
  findOne(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Workspace('_id') workspaceId: string,
    @Project('_id') projectId: string,
    @Param() { id: projectLaneId }: FindOneParams,
  ): Promise<ProjectLaneDocument> {
    if (isAdmin) {
      return this.projectLanesService.findOne(
        workspaceId,
        projectId,
        projectLaneId,
      );
    }
    return this.projectLanesService.findOne(
      workspaceId,
      projectId,
      projectLaneId,
      userId,
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
  @Permissions(Action.UpdateProjectLane)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'projectId', description: 'The project id' })
  @ApiParam({ name: 'id', description: 'The project lane id' })
  @ApiOperation({ summary: 'Update a project lane' })
  @ApiOkResponse({
    description: 'The project lane has been successfully updated',
    type: ProjectLaneDto,
  })
  @ApiBadRequestResponse({
    description:
      'The provided project lane, workspace id, project id or lane id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description:
      'The workspace, project or project lane with the given id was not found',
    type: ExceptionDto,
  })
  update(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Workspace('_id') workspaceId: string,
    @Project('_id') projectId: string,
    @Param() { id: projectLaneId }: FindOneParams,
    @Body() updateProjectLaneDto: UpdateProjectLaneDto,
  ): Promise<ProjectLaneDocument> {
    if (isAdmin) {
      return this.projectLanesService.update(
        workspaceId,
        projectId,
        projectLaneId,
        updateProjectLaneDto,
      );
    }
    return this.projectLanesService.update(
      workspaceId,
      projectId,
      projectLaneId,
      updateProjectLaneDto,
      userId,
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
  @Permissions(Action.DeleteProjectLane)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'projectId', description: 'The project id' })
  @ApiParam({ name: 'id', description: 'The project lane id' })
  @ApiOperation({ summary: 'Delete a project lane' })
  @ApiOkResponse({
    description: 'The project lane has been successfully deleted',
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
  remove(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Workspace('_id') workspaceId: string,
    @Project('_id') projectId: string,
    @Param() { id: projectLaneId }: FindOneParams,
  ): Promise<void> {
    if (isAdmin) {
      return this.projectLanesService.remove(
        workspaceId,
        projectId,
        projectLaneId,
      );
    }
    return this.projectLanesService.remove(
      workspaceId,
      projectId,
      projectLaneId,
      userId,
    );
  }
}
