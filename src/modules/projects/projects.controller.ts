import {
  ApiTags,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { FindOneParams } from './../../utils/find-one-params';
import { WorkspaceDocument } from './../workspaces/schemas/workspace.schema';
import { UserDocument } from './../users/schemas/user.schema';
import { ProjectDto } from './dto/project.dto';
import { TransformInterceptor } from './../../interceptors/transform.interceptor';
import { WorkspaceInterceptor } from './../../interceptors/workspace.interceptor';
import { JwtAuthenticationGuard } from './../authentication/guards/jwt-authentication.guard';
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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { User } from '../../decorators/user.decorator';
import { Workspace } from '../../decorators/workspace.decorator';
import { ProjectDocument } from './schemas/project.schema';

@ApiCookieAuth()
@ApiTags('Projects')
@UseGuards(JwtAuthenticationGuard)
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
  @ApiCreatedResponse({
    description: 'The project has been successfully created',
    type: ProjectDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided project is not valid',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description: 'The workspace with the given id was not found',
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
  @ApiOkResponse({
    description: 'The projects have been successfully retrieved',
    type: [ProjectDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description: 'The workspace with the given id was not found',
  })
  findAll(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
  ): Promise<ProjectDocument[]> {
    return this.projectsService.findAll(workspaceId, userId);
  }

  /**
   * Get a project
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param projectId the project id
   */
  @Get(':id')
  @ApiOkResponse({
    description: 'The project has been successfully retrieved',
    type: ProjectDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description: 'The workspace or project with the given id was not found',
  })
  findOne(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Param() { id: deploymentId }: FindOneParams,
  ): Promise<ProjectDocument> {
    return this.projectsService.findOne(userId, workspaceId, deploymentId);
  }

  /**
   * Update a project
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param projectId the project id
   * @param updateProjectDto the updated project
   */
  @Put(':id')
  @ApiOkResponse({
    description: 'The project has been successfully updated',
    type: ProjectDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided project is not valid',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description: 'The workspace or project with the given id was not found',
  })
  update(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Param() { id: deploymentId }: FindOneParams,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectDocument> {
    return this.projectsService.update(
      userId,
      workspaceId,
      deploymentId,
      updateProjectDto,
    );
  }

  /**
   * Delete a project
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param projectId the project id
   */
  @Delete(':id')
  @ApiOkResponse({
    description: 'The project has been successfully deleted',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description: 'The workspace or project with the given id was not found',
  })
  remove(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Param() { id: deploymentId }: FindOneParams,
  ): Promise<void> {
    return this.projectsService.remove(userId, workspaceId, deploymentId);
  }
}
