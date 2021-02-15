import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { FindOneParams } from './../../../utils/find-one-params';
import { WikiSectionDocument } from '../../wiki/sections/schemas/section.schema';
import { WorkspaceDocument } from './../../workspaces/schemas/workspace.schema';
import { UserDocument } from './../../users/schemas/user.schema';
import { WikiSectionInterceptor } from './../../../interceptors/wiki-section.interceptor';
import { WikiPageDto } from './dto/page.dto';
import { TransformInterceptor } from './../../../interceptors/transform.interceptor';
import { WorkspaceInterceptor } from './../../../interceptors/workspace.interceptor';
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
import { WikiPagesService } from './pages.service';
import { CreateWikiPageDto } from './dto/create-page.dto';
import { UpdateWikiPageDto } from './dto/update-page.dto';
import { JwtAuthenticationGuard } from '../../authentication/guards/jwt-authentication.guard';
import { User } from '../../../decorators/user.decorator';
import { Workspace } from '../../../decorators/workspace.decorator';
import { WikiSection } from '../../../decorators/wiki-section.decorator';
import { WikiPageDocument } from './schemas/page.schema';

@ApiCookieAuth()
@ApiTags('Wiki Pages')
@UseGuards(JwtAuthenticationGuard)
@Controller('api/workspaces/:workspaceId/sections/:sectionId/pages')
@UseInterceptors(
  WorkspaceInterceptor,
  WikiSectionInterceptor,
  new TransformInterceptor(WikiPageDto),
)
export class WikiPagesController {
  constructor(private readonly wikiPagesService: WikiPagesService) {}

  @Post()
  create(
    @User() user: UserDocument,
    @Workspace() workspace: WorkspaceDocument,
    @WikiSection() wikiSection: WikiSectionDocument,
    @Body() createWikiPageDto: CreateWikiPageDto,
  ): Promise<WikiPageDocument> {
    return this.wikiPagesService.create(
      user,
      workspace,
      wikiSection,
      createWikiPageDto,
    );
  }

  @Get()
  findAll(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @WikiSection('_id') wikiSectionId: string,
  ): Promise<WikiPageDocument[]> {
    return this.wikiPagesService.findAll(userId, workspaceId, wikiSectionId);
  }

  @Get(':id')
  findOne(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @WikiSection('_id') wikiSectionId: string,
    @Param() { id }: FindOneParams,
  ): Promise<WikiPageDocument> {
    return this.wikiPagesService.findOne(
      userId,
      workspaceId,
      wikiSectionId,
      id,
    );
  }

  @Put(':id')
  update(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @WikiSection('_id') wikiSectionId: string,
    @Param() { id }: FindOneParams,
    @Body() updateWikiPageDto: UpdateWikiPageDto,
  ): Promise<WikiPageDocument> {
    return this.wikiPagesService.update(
      userId,
      workspaceId,
      wikiSectionId,
      id,
      updateWikiPageDto,
    );
  }

  @Delete(':id')
  remove(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @WikiSection('_id') wikiSectionId: string,
    @Param() { id }: FindOneParams,
  ): Promise<void> {
    return this.wikiPagesService.remove(userId, workspaceId, wikiSectionId, id);
  }
}
