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

@Controller('api/workspaces')
@UseGuards(JwtAuthenticationGuard)
@UseInterceptors(new TransformInterceptor(WorkspaceDto))
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(
    @User() user: UserDocument,
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ): Promise<WorkspaceDocument> {
    return this.workspacesService.create(user, createWorkspaceDto);
  }

  @Get()
  findAll(@User('_id') userId: string): Promise<WorkspaceDocument[]> {
    return this.workspacesService.findAll(userId);
  }

  @Get(':id')
  findOne(
    @User('_id') userId: string,
    @Param() { id }: FindOneParams,
  ): Promise<WorkspaceDocument> {
    return this.workspacesService.findOne(userId, id);
  }

  @Put(':id')
  update(
    @User('_id') userId: string,
    @Param() { id }: FindOneParams,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ): Promise<WorkspaceDocument> {
    return this.workspacesService.update(userId, id, updateWorkspaceDto);
  }

  @Delete(':id')
  remove(
    @User('_id') userId: string,
    @Param() { id }: FindOneParams,
  ): Promise<void> {
    return this.workspacesService.remove(userId, id);
  }
}
