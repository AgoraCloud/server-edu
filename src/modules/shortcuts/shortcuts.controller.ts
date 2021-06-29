import { ShortcutDocument } from './schemas/shortcut.schema';
import { FindOneParams } from './../../utils/find-one-params';
import { WorkspaceDocument } from './../workspaces/schemas/workspace.schema';
import { UserDocument } from './../users/schemas/user.schema';
import { WorkspaceInterceptor } from './../../interceptors/workspace.interceptor';
import {
  CreateShortcutDto,
  UpdateShortcutDto,
  ActionDto,
  ShortcutDto,
  AuditActionDto,
  AuditResourceDto,
  ExceptionDto,
} from '@agoracloud/common';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseInterceptors,
  Put,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiParam,
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Auth } from '../../decorators/auth.decorator';
import { ShortcutsService } from './shortcuts.service';
import { Transform } from '../../decorators/transform.decorator';
import { Permissions } from '../../decorators/permissions.decorator';
import { Audit } from '../../decorators/audit.decorator';
import { User } from '../../decorators/user.decorator';
import { Workspace } from '../../decorators/workspace.decorator';
import { IsAdmin } from '../../decorators/is-admin.decorator';

@ApiCookieAuth()
@ApiTags('Shortcuts')
@Auth(ActionDto.ReadWorkspace)
@Controller('api/workspaces/:workspaceId/shortcuts')
@UseInterceptors(WorkspaceInterceptor)
@Transform(ShortcutDto)
export class ShortcutsController {
  constructor(private readonly shortcutsService: ShortcutsService) {}

  /**
   * Create a new shortcut
   * @param user the user
   * @param workspace the workspace
   * @param createShortcutDto the shortcut to create
   */
  @Post()
  @Permissions(ActionDto.CreateShortcut)
  @Audit(AuditActionDto.Create, AuditResourceDto.Shortcut)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiOperation({ summary: 'Create a new shortcut' })
  @ApiCreatedResponse({
    description: 'The shortcut has been successfully created',
    type: ShortcutDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided shortcut or workspace id was not valid',
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
    @Body() createShortcutDto: CreateShortcutDto,
  ): Promise<ShortcutDocument> {
    return this.shortcutsService.create(user, workspace, createShortcutDto);
  }

  /**
   * Get all shortcuts
   * @param userId the users id
   * @param workspaceId the workspace id
   */
  @Get()
  @Permissions(ActionDto.ReadShortcut)
  @Audit(AuditActionDto.Read, AuditResourceDto.Shortcut)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiOperation({ summary: 'Get all shortcuts' })
  @ApiOkResponse({
    description: 'The shortcuts have been successfully retrieved',
    type: [ShortcutDto],
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
  ): Promise<ShortcutDocument[]> {
    if (isAdmin) {
      return this.shortcutsService.findAll(workspaceId);
    } else {
      return this.shortcutsService.findAll(workspaceId, userId);
    }
  }

  /**
   * Get a shortcut
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param shortcutId the shortcut id
   */
  @Get(':id')
  @Permissions(ActionDto.ReadShortcut)
  @Audit(AuditActionDto.Read, AuditResourceDto.Shortcut)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'id', description: 'The shortcut id' })
  @ApiOperation({ summary: 'Get a shortcut' })
  @ApiOkResponse({
    description: 'The shortcut has been successfully retrieved',
    type: ShortcutDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided workspace id or shortcut id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace or shortcut with the given id was not found',
    type: ExceptionDto,
  })
  findOne(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Workspace('_id') workspaceId: string,
    @Param() { id: shortcutId }: FindOneParams,
  ): Promise<ShortcutDocument> {
    if (isAdmin) {
      return this.shortcutsService.findOne(workspaceId, shortcutId);
    } else {
      return this.shortcutsService.findOne(workspaceId, shortcutId, userId);
    }
  }

  /**
   * Update a shortcut
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param shortcutId the shortcut id
   * @param updateShortcutDto the updated shortcut
   */
  @Put(':id')
  @Permissions(ActionDto.UpdateShortcut)
  @Audit(AuditActionDto.Update, AuditResourceDto.Shortcut)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'id', description: 'The shortcut id' })
  @ApiOperation({ summary: 'Update a shortcut' })
  @ApiOkResponse({
    description: 'The shortcut has been successfully updated',
    type: ShortcutDto,
  })
  @ApiBadRequestResponse({
    description:
      'The provided shortcut, workspace id or shortcut id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace or shortcut with the given id was not found',
    type: ExceptionDto,
  })
  update(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Workspace('_id') workspaceId: string,
    @Param() { id: shortcutId }: FindOneParams,
    @Body() updateShortcutDto: UpdateShortcutDto,
  ): Promise<ShortcutDocument> {
    if (isAdmin) {
      return this.shortcutsService.update(
        workspaceId,
        shortcutId,
        updateShortcutDto,
      );
    } else {
      return this.shortcutsService.update(
        workspaceId,
        shortcutId,
        updateShortcutDto,
        userId,
      );
    }
  }

  /**
   * Delete a shortcut
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param shortcutId the shortcut id
   */
  @Delete(':id')
  @Permissions(ActionDto.DeleteShortcut)
  @Audit(AuditActionDto.Delete, AuditResourceDto.Shortcut)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'id', description: 'The shortcut id' })
  @ApiOperation({ summary: 'Delete a shortcut' })
  @ApiOkResponse({
    description: 'The shortcut has been successfully deleted',
  })
  @ApiBadRequestResponse({
    description: 'The provided workspace id or shortcut id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace or shortcut with the given id was not found',
    type: ExceptionDto,
  })
  remove(
    @User('_id') userId: string,
    @IsAdmin() isAdmin: boolean,
    @Workspace('_id') workspaceId: string,
    @Param() { id: shortcutId }: FindOneParams,
  ): Promise<void> {
    if (isAdmin) {
      return this.shortcutsService.remove(workspaceId, shortcutId);
    } else {
      return this.shortcutsService.remove(workspaceId, shortcutId, userId);
    }
  }
}
