import { Auth } from '../../decorators/auth.decorator';
import { Action } from './../authorization/schemas/permission.schema';
import { Permissions } from './../../decorators/permissions.decorator';
import { ExceptionDto } from './../../utils/base.dto';
import {
  ApiTags,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiOperation,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { WorkspaceDto } from './dto/workspace.dto';
import { TransformInterceptor } from './../../interceptors/transform.interceptor';
import { WorkspaceDocument } from './schemas/workspace.schema';
import { UserDocument } from '../users/schemas/user.schema';
import { FindOneParams } from './../../utils/find-one-params';
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
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { User } from '../../decorators/user.decorator';
import { IsAdmin } from '../../decorators/is-admin.decorator';

@ApiCookieAuth()
@ApiTags('Workspaces')
@Controller('api/workspaces')
@Auth()
@UseInterceptors(new TransformInterceptor(WorkspaceDto))
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  /**
   * Create a workspace
   * @param user the user
   * @param createWorkspaceDto the workspace to create
   */
  @Post()
  @Permissions(Action.CreateWorkspace)
  @ApiOperation({ summary: 'Create a workspace' })
  @ApiCreatedResponse({
    description: 'The workspace has been successfully created',
    type: WorkspaceDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided workspace was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  create(
    @User() user: UserDocument,
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ): Promise<WorkspaceDocument> {
    return this.workspacesService.create(user, createWorkspaceDto);
  }

  /**
   * Get all workspaces
   * @param userId the users id
   */
  @Get()
  @Permissions(Action.ReadWorkspace)
  @ApiOperation({ summary: 'Get all workspaces' })
  @ApiOkResponse({
    description: 'The workspaces have been successfully retrieved',
    type: [WorkspaceDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  findAll(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
  ): Promise<WorkspaceDocument[]> {
    if (isAdmin) {
      return this.workspacesService.findAll();
    }
    return this.workspacesService.findAll(userId);
  }

  /**
   * Get a workspace
   * @param userId the users id
   * @param workspaceId the workspace id
   */
  @Get(':id')
  @Permissions(Action.ReadWorkspace)
  @ApiParam({ name: 'id', description: 'The workspace id' })
  @ApiOperation({ summary: 'Get a workspace' })
  @ApiOkResponse({
    description: 'The workspace has been successfully retrieved',
    type: WorkspaceDto,
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
  findOne(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Param() { id: workspaceId }: FindOneParams,
  ): Promise<WorkspaceDocument> {
    if (isAdmin) {
      return this.workspacesService.findOne(workspaceId);
    }
    return this.workspacesService.findOne(workspaceId, userId);
  }

  /**
   * Update a workspace
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param updateWorkspaceDto the updated workspace
   */
  @Put(':id')
  @Permissions(Action.UpdateWorkspace)
  @ApiParam({ name: 'id', description: 'The workspace id' })
  @ApiOperation({ summary: 'Update a workspace' })
  @ApiOkResponse({
    description: 'The workspace has been successfully updated',
    type: WorkspaceDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided workspace or workspace id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace with the given id was not found',
    type: ExceptionDto,
  })
  update(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Param() { id: workspaceId }: FindOneParams,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ): Promise<WorkspaceDocument> {
    if (isAdmin) {
      return this.workspacesService.update(workspaceId, updateWorkspaceDto);
    }
    return this.workspacesService.update(
      workspaceId,
      updateWorkspaceDto,
      userId,
    );
  }

  /**
   * Delete a workspace
   * @param userId the users id
   * @param workspaceId the workspace id
   */
  @Delete(':id')
  @Permissions(Action.DeleteWorkspace)
  @ApiParam({ name: 'id', description: 'The workspace id' })
  @ApiOperation({ summary: 'Delete a workspace' })
  @ApiOkResponse({
    description: 'The workspace has been successfully deleted',
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
  remove(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Param() { id: workspaceId }: FindOneParams,
  ): Promise<void> {
    if (isAdmin) {
      return this.workspacesService.remove(workspaceId);
    }
    return this.workspacesService.remove(workspaceId, userId);
  }
}
