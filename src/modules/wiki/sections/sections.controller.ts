import { WorkspaceDocument } from './../../workspaces/schemas/workspace.schema';
import { FindOneParams } from './../../../utils/find-one-params';
import { UserDocument } from './../../users/schemas/user.schema';
import { WikiSectionDto } from './dto/section.dto';
import { TransformInterceptor } from './../../../interceptors/transform.interceptor';
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
import { WikiSectionsService } from './sections.service';
import { CreateWikiSectionDto } from './dto/create-section.dto';
import { UpdateWikiSectionDto } from './dto/update-section.dto';
import { WorkspaceInterceptor } from '../../../interceptors/workspace.interceptor';
import { User } from '../../../decorators/user.decorator';
import { Workspace } from '../../../decorators/workspace.decorator';
import { WikiSectionDocument } from './schemas/section.schema';

@UseGuards(JwtAuthenticationGuard)
@Controller('api/workspaces/:workspaceId/sections')
@UseInterceptors(WorkspaceInterceptor, new TransformInterceptor(WikiSectionDto))
export class WikiSectionsController {
  constructor(private readonly wikiSectionsService: WikiSectionsService) {}

  @Post()
  create(
    @User() user: UserDocument,
    @Workspace() workspace: WorkspaceDocument,
    @Body() createWikiSectionDto: CreateWikiSectionDto,
  ): Promise<WikiSectionDocument> {
    return this.wikiSectionsService.create(
      user,
      workspace,
      createWikiSectionDto,
    );
  }

  @Get()
  findAll(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
  ): Promise<WikiSectionDocument[]> {
    return this.wikiSectionsService.findAll(workspaceId, userId);
  }

  @Get(':id')
  findOne(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Param() { id }: FindOneParams,
  ): Promise<WikiSectionDocument> {
    return this.wikiSectionsService.findOne(userId, workspaceId, id);
  }

  @Put(':id')
  update(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Param() { id }: FindOneParams,
    @Body() updateWikiSectionDto: UpdateWikiSectionDto,
  ): Promise<WikiSectionDocument> {
    return this.wikiSectionsService.update(
      userId,
      workspaceId,
      id,
      updateWikiSectionDto,
    );
  }

  @Delete(':id')
  remove(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Param() { id }: FindOneParams,
  ): Promise<void> {
    return this.wikiSectionsService.remove(userId, workspaceId, id);
  }
}
