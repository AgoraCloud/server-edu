import {
  ApiTags,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
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
  @ApiParam({ name: 'workspaceId' })
  @ApiCreatedResponse({
    description: 'The wiki section has been successfully created',
    type: WikiSectionDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided wiki section was not valid',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description: 'The workspace with the given id was not found',
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
  @ApiParam({ name: 'workspaceId' })
  @ApiOkResponse({
    description: 'The wiki sections have been successfully retrieved',
    type: [WikiSectionDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description: 'The workspace with the given id was not found',
  })
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
  @ApiParam({ name: 'workspaceId' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({
    description: 'The wiki section has been successfully retrieved',
    type: WikiSectionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description:
      'The workspace or wiki section with the given id was not found',
  })
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
  @ApiParam({ name: 'workspaceId' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({
    description: 'The wiki section has been successfully updated',
    type: WikiSectionDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided wiki section was not valid',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description:
      'The workspace or wiki section with the given id was not found',
  })
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
  @ApiParam({ name: 'workspaceId' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({
    description: 'The wiki section has been successfully deleted',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description:
      'The workspace or wiki section with the given id was not found',
  })
  remove(
    @User('_id') userId: string,
    @Workspace('_id') workspaceId: string,
    @Param() { id: wikiSectionId }: FindOneParams,
  ): Promise<void> {
    return this.wikiSectionsService.remove(userId, workspaceId, wikiSectionId);
  }
}
