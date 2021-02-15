import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { WorkspaceDto } from './dto/workspace.dto';
import { TransformInterceptor } from './../../interceptors/transform.interceptor';
import { WorkspaceDocument } from './schemas/workspace.schema';
import { UserDocument } from '../users/schemas/user.schema';
import { JwtAuthenticationGuard } from '../authentication/guards/jwt-authentication.guard';
import { FindOneParams } from './../../utils/find-one-params';
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
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { User } from '../../decorators/user.decorator';

@ApiCookieAuth()
@ApiTags('Workspaces')
@Controller('api/workspaces')
@UseGuards(JwtAuthenticationGuard)
@UseInterceptors(new TransformInterceptor(WorkspaceDto))
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  /**
   * Create a workspace
   * @param user the user
   * @param createWorkspaceDto the workspace to create
   */
  @Post()
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
  findAll(@User('_id') userId: string): Promise<WorkspaceDocument[]> {
    return this.workspacesService.findAll(userId);
  }

  /**
   * Get a workspace
   * @param userId the users id
   * @param workspaceId the workspace id
   */
  @Get(':id')
  findOne(
    @User('_id') userId: string,
    @Param() { id: workspaceId }: FindOneParams,
  ): Promise<WorkspaceDocument> {
    return this.workspacesService.findOne(userId, workspaceId);
  }

  /**
   * Update a workspace
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param updateWorkspaceDto the updated workspace
   */
  @Put(':id')
  update(
    @User('_id') userId: string,
    @Param() { id: workspaceId }: FindOneParams,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ): Promise<WorkspaceDocument> {
    return this.workspacesService.update(
      userId,
      workspaceId,
      updateWorkspaceDto,
    );
  }

  /**
   * Delete a workspace
   * @param userId the users id
   * @param workspaceId the workspace id
   */
  @Delete(':id')
  remove(
    @User('_id') userId: string,
    @Param() { id: workspaceId }: FindOneParams,
  ): Promise<void> {
    return this.workspacesService.remove(userId, workspaceId);
  }
}
