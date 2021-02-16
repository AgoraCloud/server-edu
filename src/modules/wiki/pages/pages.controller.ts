import {
  ApiTags,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
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

  /**
   * Create a wiki page
   * @param user the user
   * @param workspace the workspace
   * @param wikiSection the wiki section
   * @param createWikiPageDto the wiki page to create
   */
  @Post()
  @ApiParam({ name: 'workspaceId' })
  @ApiParam({ name: 'sectionId' })
  @ApiCreatedResponse({
    description: 'The wiki page has been successfully created',
    type: WikiPageDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided wiki page was not valid',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description:
      'The workspace or wiki section with the given id was not found',
  })
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

  /**
   * Get all wiki pages
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param wikiSectionId the wiki section id
   */
  @Get()
  @ApiParam({ name: 'workspaceId' })
  @ApiParam({ name: 'sectionId' })
  @ApiOkResponse({
    description: 'The wiki pages have been successfully retrieved',
    type: [WikiPageDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description:
      'The workspace or wiki section with the given id was not found',
  })
  findAll(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @WikiSection('_id') wikiSectionId: string,
  ): Promise<WikiPageDocument[]> {
    return this.wikiPagesService.findAll(userId, workspaceId, wikiSectionId);
  }

  /**
   * Get a wiki page
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param wikiSectionId the wiki section id
   * @param wikiPageId the wiki page id
   */
  @Get(':id')
  @ApiParam({ name: 'workspaceId' })
  @ApiParam({ name: 'sectionId' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({
    description: 'The wiki page has been successfully retrieved',
    type: WikiPageDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description:
      'The workspace, wiki section or wiki page with the given id was not found',
  })
  findOne(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @WikiSection('_id') wikiSectionId: string,
    @Param() { id: wikiPageId }: FindOneParams,
  ): Promise<WikiPageDocument> {
    return this.wikiPagesService.findOne(
      userId,
      workspaceId,
      wikiSectionId,
      wikiPageId,
    );
  }

  /**
   * Update a wiki page
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param wikiSectionId the wiki section id
   * @param wikiPageId the wiki page id
   * @param updateWikiPageDto the updated wiki page
   */
  @Put(':id')
  @ApiParam({ name: 'workspaceId' })
  @ApiParam({ name: 'sectionId' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({
    description: 'The wiki page has been successfully updated',
    type: WikiPageDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided wiki page was not valid',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description:
      'The workspace, wiki section or wiki page with the given id was not found',
  })
  update(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @WikiSection('_id') wikiSectionId: string,
    @Param() { id: wikiPageId }: FindOneParams,
    @Body() updateWikiPageDto: UpdateWikiPageDto,
  ): Promise<WikiPageDocument> {
    return this.wikiPagesService.update(
      userId,
      workspaceId,
      wikiSectionId,
      wikiPageId,
      updateWikiPageDto,
    );
  }

  /**
   * Delete a wiki page
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param wikiSectionId the wiki section id
   * @param wikiPageId the wiki page id
   */
  @Delete(':id')
  @ApiParam({ name: 'workspaceId' })
  @ApiParam({ name: 'sectionId' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({
    description: 'The wiki page has been successfully deleted',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description:
      'The workspace, wiki section or wiki page with the given id was not found',
  })
  remove(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @WikiSection('_id') wikiSectionId: string,
    @Param() { id: wikiPageId }: FindOneParams,
  ): Promise<void> {
    return this.wikiPagesService.remove(
      userId,
      workspaceId,
      wikiSectionId,
      wikiPageId,
    );
  }
}
