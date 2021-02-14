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

@UseGuards(JwtAuthenticationGuard)
@Controller('api/workspaces/:workspaceId/projects')
@UseInterceptors(WorkspaceInterceptor, new TransformInterceptor(ProjectDto))
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(
    @User() user: UserDocument,
    @Workspace() workspace: WorkspaceDocument,
    @Body() createProjectDto: CreateProjectDto,
  ): Promise<ProjectDocument> {
    return this.projectsService.create(user, workspace, createProjectDto);
  }

  @Get()
  findAll(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
  ): Promise<ProjectDocument[]> {
    return this.projectsService.findAll(workspaceId, userId);
  }

  @Get(':id')
  findOne(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Param() { id }: FindOneParams,
  ): Promise<ProjectDocument> {
    return this.projectsService.findOne(userId, workspaceId, id);
  }

  @Put(':id')
  update(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Param() { id }: FindOneParams,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectDocument> {
    return this.projectsService.update(
      userId,
      workspaceId,
      id,
      updateProjectDto,
    );
  }

  @Delete(':id')
  remove(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Param() { id }: FindOneParams,
  ): Promise<void> {
    return this.projectsService.remove(userId, workspaceId, id);
  }
}
