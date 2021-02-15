import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
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

@ApiCookieAuth()
@ApiTags('Wiki Sections')
@UseGuards(JwtAuthenticationGuard)
@Controller('api/workspaces/:workspaceId/sections')
@UseInterceptors(WorkspaceInterceptor, new TransformInterceptor(WikiSectionDto))
export class WikiSectionsController {
  constructor(private readonly wikiSectionsService: WikiSectionsService) {}

  /**
   * Create a wiki section
   * @param user the user
   * @param workspace the workspace
   * @param createWikiSectionDto the wiki section to create
   */
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

  /**
   * Get all wiki sections
   * @param userId the users id
   * @param workspaceId the workspace id
   */
  @Get()
  findAll(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
  ): Promise<WikiSectionDocument[]> {
    return this.wikiSectionsService.findAll(workspaceId, userId);
  }

  /**
   * Get a wiki section
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param wikiSectionId the wiki section id
   */
  @Get(':id')
  findOne(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Param() { id: wikiSectionId }: FindOneParams,
  ): Promise<WikiSectionDocument> {
    return this.wikiSectionsService.findOne(userId, workspaceId, wikiSectionId);
  }

  /**
   * Update a wiki section
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param wikiSectionId the wiki section id
   * @param updateWikiSectionDto the updated wiki section
   */
  @Put(':id')
  update(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Param() { id: wikiSectionId }: FindOneParams,
    @Body() updateWikiSectionDto: UpdateWikiSectionDto,
  ): Promise<WikiSectionDocument> {
    return this.wikiSectionsService.update(
      userId,
      workspaceId,
      wikiSectionId,
      updateWikiSectionDto,
    );
  }

  /**
   * Delete a wiki section
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param wikiSectionId the wiki section id
   */
  @Delete(':id')
  remove(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Param() { id: wikiSectionId }: FindOneParams,
  ): Promise<void> {
    return this.wikiSectionsService.remove(userId, workspaceId, wikiSectionId);
  }
}
