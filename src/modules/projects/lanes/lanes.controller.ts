import {
  ApiTags,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
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
  @ApiParam({ name: 'workspaceId' })
  @ApiParam({ name: 'projectId' })
  @ApiCreatedResponse({
    description: 'The project lane has been successfully created',
    type: ProjectLaneDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided project lane was not valid',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description: 'The workspace or project with the given id was not found',
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
  @ApiParam({ name: 'workspaceId' })
  @ApiParam({ name: 'projectId' })
  @ApiOkResponse({
    description: 'The project lanes have been successfully retrieved',
    type: [ProjectLaneDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description: 'The workspace or project with the given id was not found',
  })
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
  @ApiParam({ name: 'workspaceId' })
  @ApiParam({ name: 'projectId' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({
    description: 'The project lane has been successfully retrieved',
    type: ProjectLaneDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description:
      'The workspace, project or project lane with the given id was not found',
  })
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
  @ApiParam({ name: 'workspaceId' })
  @ApiParam({ name: 'projectId' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({
    description: 'The project lane has been successfully updated',
    type: ProjectLaneDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided project lane was not valid',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description:
      'The workspace, project or project lane with the given id was not found',
  })
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
  @ApiParam({ name: 'workspaceId' })
  @ApiParam({ name: 'projectId' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({
    description: 'The project lane has been successfully deleted',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description:
      'The workspace, project or project lane with the given id was not found',
  })
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
