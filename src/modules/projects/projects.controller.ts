import { Action } from './../authorization/schemas/permission.schema';
import { Auth } from '../../decorators/auth.decorator';
import { ExceptionDto } from './../../utils/base.dto';
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
import { FindOneParams } from './../../utils/find-one-params';
import { WorkspaceDocument } from './../workspaces/schemas/workspace.schema';
import { UserDocument } from './../users/schemas/user.schema';
import { ProjectDto } from './dto/project.dto';
import { TransformInterceptor } from './../../interceptors/transform.interceptor';
import { WorkspaceInterceptor } from './../../interceptors/workspace.interceptor';
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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { User } from '../../decorators/user.decorator';
import { Workspace } from '../../decorators/workspace.decorator';
import { ProjectDocument } from './schemas/project.schema';
import { Permissions } from '../../decorators/permissions.decorator';
import { IsAdmin } from '../../decorators/is-admin.decorator';

@ApiCookieAuth()
@ApiTags('Projects')
@Auth(Action.ReadWorkspace)
@Controller('api/workspaces/:workspaceId/projects')
@UseInterceptors(WorkspaceInterceptor, new TransformInterceptor(ProjectDto))
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * Create a new project
   * @param user the user
   * @param workspace the workspace
   * @param createProjectDto the project to create
   */
  @Post()
  @Permissions(Action.CreateProject)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiOperation({ summary: 'Create a new project' })
  @ApiCreatedResponse({
    description: 'The project has been successfully created',
    type: ProjectDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided project or workspace id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace with the given id was not found',
    type: ExceptionDto,
  })
  create(
    @User() user: UserDocument,
    @Workspace() workspace: WorkspaceDocument,
    @Body() createProjectDto: CreateProjectDto,
  ): Promise<ProjectDocument> {
    return this.projectsService.create(user, workspace, createProjectDto);
  }

  /**
   * Get all projects
   * @param userId the users id
   * @param workspaceId the workspace id
   */
  @Get()
  @Permissions(Action.ReadProject)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiOperation({ summary: 'Get all projects' })
  @ApiOkResponse({
    description: 'The projects have been successfully retrieved',
    type: [ProjectDto],
  })
  @ApiBadRequestResponse({
    description: 'The provided workspace id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace with the given id was not found',
    type: ExceptionDto,
  })
  findAll(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Workspace('_id') workspaceId: string,
  ): Promise<ProjectDocument[]> {
    if (isAdmin) {
      return this.projectsService.findAll(workspaceId);
    }
    return this.projectsService.findAll(workspaceId, userId);
  }

  /**
   * Get a project
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param projectId the project id
   */
  @Get(':id')
  @Permissions(Action.ReadProject)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'id', description: 'The project id' })
  @ApiOperation({ summary: 'Get a project' })
  @ApiOkResponse({
    description: 'The project has been successfully retrieved',
    type: ProjectDto,
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
  findOne(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Workspace('_id') workspaceId: string,
    @Param() { id: projectId }: FindOneParams,
  ): Promise<ProjectDocument> {
    if (isAdmin) {
      return this.projectsService.findOne(workspaceId, projectId);
    }
    return this.projectsService.findOne(workspaceId, projectId, userId);
  }

  /**
   * Update a project
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param projectId the project id
   * @param updateProjectDto the updated project
   */
  @Put(':id')
  @Permissions(Action.UpdateProject)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'id', description: 'The project id' })
  @ApiOperation({ summary: 'Update a project' })
  @ApiOkResponse({
    description: 'The project has been successfully updated',
    type: ProjectDto,
  })
  @ApiBadRequestResponse({
    description:
      'The provided project, workspace id or project id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace or project with the given id was not found',
    type: ExceptionDto,
  })
  update(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Workspace('_id') workspaceId: string,
    @Param() { id: projectId }: FindOneParams,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectDocument> {
    if (isAdmin) {
      return this.projectsService.update(
        workspaceId,
        projectId,
        updateProjectDto,
      );
    }
    return this.projectsService.update(
      workspaceId,
      projectId,
      updateProjectDto,
      userId,
    );
  }

  /**
   * Delete a project
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param projectId the project id
   */
  @Delete(':id')
  @Permissions(Action.DeleteProject)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'id', description: 'The project id' })
  @ApiOperation({ summary: 'Delete a project' })
  @ApiOkResponse({
    description: 'The project has been successfully deleted',
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
  remove(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Workspace('_id') workspaceId: string,
    @Param() { id: projectId }: FindOneParams,
  ): Promise<void> {
    if (isAdmin) {
      return this.projectsService.remove(workspaceId, projectId);
    }
    return this.projectsService.remove(workspaceId, projectId, userId);
  }
}
