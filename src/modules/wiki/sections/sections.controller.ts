import { IsAdmin } from '../../../decorators/is-admin.decorator';
import { Permissions } from './../../../decorators/permissions.decorator';
import { Action } from './../../authorization/schemas/permission.schema';
import { Auth } from '../../../decorators/auth.decorator';
import { ExceptionDto } from './../../../utils/base.dto';
import {
  ApiTags,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiOperation,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { WorkspaceDocument } from './../../workspaces/schemas/workspace.schema';
import { FindOneParams } from './../../../utils/find-one-params';
import { UserDocument } from './../../users/schemas/user.schema';
import { WikiSectionDto } from './dto/section.dto';
import { TransformInterceptor } from './../../../interceptors/transform.interceptor';
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
import { WikiSectionsService } from './sections.service';
import { CreateWikiSectionDto } from './dto/create-section.dto';
import { UpdateWikiSectionDto } from './dto/update-section.dto';
import { WorkspaceInterceptor } from '../../../interceptors/workspace.interceptor';
import { User } from '../../../decorators/user.decorator';
import { Workspace } from '../../../decorators/workspace.decorator';
import { WikiSectionDocument } from './schemas/section.schema';

@ApiCookieAuth()
@ApiTags('Wiki Sections')
@Auth(Action.ReadWorkspace)
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
  @Permissions(Action.CreateWikiSection)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiOperation({ summary: 'Create a wiki section' })
  @ApiCreatedResponse({
    description: 'The wiki section has been successfully created',
    type: WikiSectionDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided wiki section or workspace id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace with the given id was not found',
    type: ExceptionDto,
  })
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
  @Permissions(Action.ReadWikiSection)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiOperation({ summary: 'Get all wiki sections' })
  @ApiOkResponse({
    description: 'The wiki sections have been successfully retrieved',
    type: [WikiSectionDto],
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
  findAll(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Workspace('_id') workspaceId: string,
  ): Promise<WikiSectionDocument[]> {
    if (isAdmin) {
      return this.wikiSectionsService.findAll(workspaceId);
    }
    return this.wikiSectionsService.findAll(workspaceId, userId);
  }

  /**
   * Get a wiki section
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param wikiSectionId the wiki section id
   */
  @Get(':id')
  @Permissions(Action.ReadWikiSection)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'id', description: 'The section id' })
  @ApiOperation({ summary: 'Get a wiki section' })
  @ApiOkResponse({
    description: 'The wiki section has been successfully retrieved',
    type: WikiSectionDto,
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
  findOne(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Workspace('_id') workspaceId: string,
    @Param() { id: wikiSectionId }: FindOneParams,
  ): Promise<WikiSectionDocument> {
    if (isAdmin) {
      return this.wikiSectionsService.findOne(workspaceId, wikiSectionId);
    }
    return this.wikiSectionsService.findOne(workspaceId, wikiSectionId, userId);
  }

  /**
   * Update a wiki section
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param wikiSectionId the wiki section id
   * @param updateWikiSectionDto the updated wiki section
   */
  @Put(':id')
  @Permissions(Action.UpdateWikiSection)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'id', description: 'The section id' })
  @ApiOperation({ summary: 'Update a wiki section' })
  @ApiOkResponse({
    description: 'The wiki section has been successfully updated',
    type: WikiSectionDto,
  })
  @ApiBadRequestResponse({
    description:
      'The provided wiki section, workspace id or section id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description:
      'The workspace or wiki section with the given id was not found',
    type: ExceptionDto,
  })
  update(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Workspace('_id') workspaceId: string,
    @Param() { id: wikiSectionId }: FindOneParams,
    @Body() updateWikiSectionDto: UpdateWikiSectionDto,
  ): Promise<WikiSectionDocument> {
    if (isAdmin) {
      return this.wikiSectionsService.update(
        workspaceId,
        wikiSectionId,
        updateWikiSectionDto,
      );
    }
    return this.wikiSectionsService.update(
      workspaceId,
      wikiSectionId,
      updateWikiSectionDto,
      userId,
    );
  }

  /**
   * Delete a wiki section
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param wikiSectionId the wiki section id
   */
  @Delete(':id')
  @Permissions(Action.DeleteWikiSection)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'id', description: 'The section id' })
  @ApiOperation({ summary: 'Delete a wiki section' })
  @ApiOkResponse({
    description: 'The wiki section has been successfully deleted',
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
  remove(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Workspace('_id') workspaceId: string,
    @Param() { id: wikiSectionId }: FindOneParams,
  ): Promise<void> {
    if (isAdmin) {
      return this.wikiSectionsService.remove(workspaceId, wikiSectionId);
    }
    return this.wikiSectionsService.remove(workspaceId, wikiSectionId, userId);
  }
}
