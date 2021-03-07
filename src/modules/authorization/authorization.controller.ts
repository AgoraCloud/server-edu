import { ExceptionDto } from './../../utils/base.dto';
import { TransformInterceptor } from './../../interceptors/transform.interceptor';
import { PermissionDto, RolesAndPermissionsDto } from './dto/permission.dto';
import {
  Action,
  PermissionDocument,
  WorkspaceRolesAndPermissions,
} from './schemas/permission.schema';
import { UpdateWorkspaceUserPermissionsDto } from './dto/update-workspace-user-permissions.dto';
import { UpdateUserPermissionsDto } from './dto/update-user-permissions.dto';
import { UserInterceptor } from './../../interceptors/user.interceptor';
import { WorkspaceInterceptor } from './../../interceptors/workspace.interceptor';
import { Auth } from '../../decorators/auth.decorator';
import {
  Controller,
  Put,
  UseInterceptors,
  Param,
  Body,
  Get,
} from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { Workspace } from '../../decorators/workspace.decorator';
import { User } from '../../decorators/user.decorator';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiTags,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Permissions } from '../../decorators/permissions.decorator';

@ApiCookieAuth()
@ApiTags('Authorization')
@Auth()
@Controller('api')
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  /**
   * Get the logged in users permissions (application-wide and workspace-wide)
   * @param userId the users id
   */
  @Get('user/permissions')
  @UseInterceptors(new TransformInterceptor(PermissionDto))
  @ApiOperation({ summary: 'Get the logged in users permissions' })
  @ApiOkResponse({
    description: 'The users permissions have been successfully retrieved',
    type: PermissionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  findCurrentUserPermissions(
    @User('_id') userId: string,
  ): Promise<PermissionDocument> {
    return this.authorizationService.findOne(userId);
  }

  /**
   * Get a users permissions (application-wide and workspace-wide),
   * accessible by super admins only
   * @param userId the users id
   */
  @Permissions(Action.ManageUser)
  @Get('users/:userId/permissions')
  @UseInterceptors(UserInterceptor, new TransformInterceptor(PermissionDto))
  @ApiParam({ name: 'userId', description: 'The users id' })
  @ApiOperation({ summary: 'Get a users permissions' })
  @ApiOkResponse({
    description: 'The users permissions have been successfully retrieved',
    type: PermissionDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided user id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The user with the given id was not found',
    type: ExceptionDto,
  })
  findUsersPermissions(
    @Param('userId') userId: string,
  ): Promise<PermissionDocument> {
    return this.authorizationService.findOne(userId);
  }

  /**
   * Get a users workspace-wide permissions, accessible by super
   * admins and workspace admins
   * @param workspaceId the workspace id
   * @param userId the users id
   */
  @Permissions(Action.ManageWorkspace)
  @UseInterceptors(
    WorkspaceInterceptor,
    UserInterceptor,
    new TransformInterceptor(RolesAndPermissionsDto),
  )
  @Get('workspaces/:workspaceId/users/:userId/permissions')
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'userId', description: 'The users id' })
  @ApiOperation({ summary: 'Get a users  workspace-wide permissions' })
  @ApiOkResponse({
    description:
      'The users workspace-wide permissions have been successfully retrieved',
    type: RolesAndPermissionsDto,
  })
  @ApiBadRequestResponse({
    description:
      'The provided workspace id or user id was not valid or the users workspace-wide permissions could not be found',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace or user with the given id was not found',
    type: ExceptionDto,
  })
  findUsersWorkspacePermissions(
    @Workspace('_id') workspaceId: string,
    @Param('userId') userId: string,
  ): Promise<WorkspaceRolesAndPermissions> {
    return this.authorizationService.findOneWorkspacePermissions(
      userId,
      workspaceId,
    );
  }

  /**
   * Update a users application-wide permissions, accessible by super admins only
   * @param userId the users id
   * @param updateUserPermissionsDto the updated application-wide user permissions
   */
  @Permissions(Action.ManageUser)
  @Put('users/:userId/permissions')
  @UseInterceptors(
    UserInterceptor,
    new TransformInterceptor(RolesAndPermissionsDto),
  )
  @ApiParam({ name: 'userId', description: 'The users id' })
  @ApiOperation({ summary: 'Update a users application-wide permissions' })
  @ApiOkResponse({
    description: 'The users permissions have been successfully updated',
    type: RolesAndPermissionsDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided roles and permissions or user id were not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The user with the given id was not found',
    type: ExceptionDto,
  })
  updateUserPermissions(
    @Param('userId') userId: string,
    @Body() updateUserPermissionsDto: UpdateUserPermissionsDto,
  ): Promise<PermissionDocument> {
    return this.authorizationService.updateUserPermissions(
      userId,
      updateUserPermissionsDto,
    );
  }

  /**
   * Update a users workspace-wide permissions, accessible by super admins
   * and workspace admins
   * @param workspaceId the workspace id
   * @param userId the users id
   * @param updateWorkspaceUserPermissionsDto the updated workspace-wide user permissions
   */
  @Permissions(Action.ManageWorkspace)
  @Put('workspaces/:workspaceId/users/:userId/permissions')
  @UseInterceptors(
    WorkspaceInterceptor,
    UserInterceptor,
    new TransformInterceptor(RolesAndPermissionsDto),
  )
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiParam({ name: 'userId', description: 'The users id' })
  @ApiOperation({ summary: 'Update a users workspace-wide permissions' })
  @ApiOkResponse({
    description: 'The users permissions have been successfully updated',
    type: RolesAndPermissionsDto,
  })
  @ApiBadRequestResponse({
    description:
      'The provided roles and permissions were not valid, the workspace id or user id were not valid or the users workspace-wide permissions could not be found',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace or user with the given id was not found',
    type: ExceptionDto,
  })
  updateUsersWorkspacePermissions(
    @Workspace('_id') workspaceId: string,
    @Param('userId') userId: string,
    @Body()
    updateWorkspaceUserPermissionsDto: UpdateWorkspaceUserPermissionsDto,
  ): Promise<WorkspaceRolesAndPermissions> {
    return this.authorizationService.updateUsersWorkspacePermissions(
      userId,
      workspaceId,
      updateWorkspaceUserPermissionsDto,
    );
  }
}
