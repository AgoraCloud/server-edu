import { IsAdmin } from '../../../decorators/is-admin.decorator';
import { Permissions } from './../../../decorators/permissions.decorator';
import { Action } from './../../authorization/schemas/permission.schema';
import { Auth } from '../../../decorators/auth.decorator';
import { ExceptionDto } from './../../../utils/base.dto';
import {
  ApiTags,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiOperation,
  ApiForbiddenResponse,
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
  UseInterceptors,
} from '@nestjs/common';
import { WikiPagesService } from './pages.service';
import { CreateWikiPageDto } from './dto/create-page.dto';
import { UpdateWikiPageDto } from './dto/update-page.dto';
import { User } from '../../../decorators/user.decorator';
import { Workspace } from '../../../decorators/workspace.decorator';
import { WikiSection } from '../../../decorators/wiki-section.decorator';
import { WikiPageDocument } from './schemas/page.schema';

@ApiCookieAuth()
@ApiTags('Wiki Pages')
@Auth(Action.ReadWorkspace, Action.ReadWikiSection)
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
  @Permissions(Action.CreateWikiPage)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'sectionId', description: 'The wiki section id' })
  @ApiOperation({ summary: 'Create a wiki page' })
  @ApiCreatedResponse({
    description: 'The wiki page has been successfully created',
    type: WikiPageDto,
  })
  @ApiBadRequestResponse({
    description:
      'The provided wiki page, workspace id, or section id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description:
      'The workspace or wiki section with the given id was not found',
    type: ExceptionDto,
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
  @Permissions(Action.ReadWikiPage)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'sectionId', description: 'The wiki section id' })
  @ApiOperation({ summary: 'Get all wiki pages' })
  @ApiOkResponse({
    description: 'The wiki pages have been successfully retrieved',
    type: [WikiPageDto],
  })
  @ApiBadRequestResponse({
    description: 'The provided workspace id or section id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description:
      'The workspace or wiki section with the given id was not found',
    type: ExceptionDto,
  })
  findAll(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Workspace('_id') workspaceId: string,
    @WikiSection('_id') wikiSectionId: string,
  ): Promise<WikiPageDocument[]> {
    if (isAdmin) {
      return this.wikiPagesService.findAll(workspaceId, wikiSectionId);
    }
    return this.wikiPagesService.findAll(workspaceId, wikiSectionId, userId);
  }

  /**
   * Get a wiki page
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param wikiSectionId the wiki section id
   * @param wikiPageId the wiki page id
   */
  @Get(':id')
  @Permissions(Action.ReadWikiPage)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'sectionId', description: 'The wiki section id' })
  @ApiParam({ name: 'id', description: 'The wiki page id' })
  @ApiOperation({ summary: 'Get a wiki page' })
  @ApiOkResponse({
    description: 'The wiki page has been successfully retrieved',
    type: WikiPageDto,
  })
  @ApiBadRequestResponse({
    description:
      'The provided workspace id, section id or page id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description:
      'The workspace, wiki section or wiki page with the given id was not found',
    type: ExceptionDto,
  })
  findOne(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Workspace('_id') workspaceId: string,
    @WikiSection('_id') wikiSectionId: string,
    @Param() { id: wikiPageId }: FindOneParams,
  ): Promise<WikiPageDocument> {
    if (isAdmin) {
      return this.wikiPagesService.findOne(
        workspaceId,
        wikiSectionId,
        wikiPageId,
      );
    }
    return this.wikiPagesService.findOne(
      workspaceId,
      wikiSectionId,
      wikiPageId,
      userId,
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
  @Permissions(Action.UpdateWikiPage)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'sectionId', description: 'The wiki section id' })
  @ApiParam({ name: 'id', description: 'The wiki page id' })
  @ApiOperation({ summary: 'Update a wiki page' })
  @ApiOkResponse({
    description: 'The wiki page has been successfully updated',
    type: WikiPageDto,
  })
  @ApiBadRequestResponse({
    description:
      'The provided wiki page, workspace id, section id or page id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description:
      'The workspace, wiki section or wiki page with the given id was not found',
    type: ExceptionDto,
  })
  update(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Workspace('_id') workspaceId: string,
    @WikiSection('_id') wikiSectionId: string,
    @Param() { id: wikiPageId }: FindOneParams,
    @Body() updateWikiPageDto: UpdateWikiPageDto,
  ): Promise<WikiPageDocument> {
    if (isAdmin) {
      return this.wikiPagesService.update(
        workspaceId,
        wikiSectionId,
        wikiPageId,
        updateWikiPageDto,
      );
    }
    return this.wikiPagesService.update(
      workspaceId,
      wikiSectionId,
      wikiPageId,
      updateWikiPageDto,
      userId,
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
  @Permissions(Action.DeleteWikiPage)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'sectionId', description: 'The wiki section id' })
  @ApiParam({ name: 'id', description: 'The wiki page id' })
  @ApiOperation({ summary: 'Delete a wiki page' })
  @ApiOkResponse({
    description: 'The wiki page has been successfully deleted',
  })
  @ApiBadRequestResponse({
    description:
      'The provided workspace id, section id or page id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description:
      'The workspace, wiki section or wiki page with the given id was not found',
    type: ExceptionDto,
  })
  remove(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Workspace('_id') workspaceId: string,
    @WikiSection('_id') wikiSectionId: string,
    @Param() { id: wikiPageId }: FindOneParams,
  ): Promise<void> {
    if (isAdmin) {
      return this.wikiPagesService.remove(
        workspaceId,
        wikiSectionId,
        wikiPageId,
      );
    }
    return this.wikiPagesService.remove(
      workspaceId,
      wikiSectionId,
      wikiPageId,
      userId,
    );
  }
}
