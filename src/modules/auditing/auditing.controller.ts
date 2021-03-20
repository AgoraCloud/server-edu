import { ExceptionDto } from './../../utils/base.dto';
import { AuditLogDto } from './dto/audit-log.dto';
import { TransformInterceptor } from './../../interceptors/transform.interceptor';
import { AuditLogDocument } from './schemas/audit-log.schema';
import { WorkspaceInterceptor } from './../../interceptors/workspace.interceptor';
import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { Auth } from '../../decorators/auth.decorator';
import { Permissions } from '../../decorators/permissions.decorator';
import { Action } from '../authorization/schemas/permission.schema';
import { AuditingService } from './auditing.service';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiCookieAuth()
@ApiTags('Auditing')
@Auth()
@Controller('api')
@UseInterceptors(new TransformInterceptor(AuditLogDto))
export class AuditingController {
  constructor(private readonly auditingService: AuditingService) {}

  /**
   * Get all audit logs, accessible by super admins only
   * @param userId the users id
   */
  @Get('audit')
  @Permissions(Action.ManageUser)
  @ApiQuery({ name: 'userId', description: 'The users id' })
  @ApiOperation({ summary: 'Get all audit logs' })
  @ApiOkResponse({
    description: 'The audit logs have been successfully retrieved',
    type: AuditLogDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided user id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  findAll(@Query('userId') userId: string): Promise<AuditLogDocument[]> {
    return this.auditingService.findAll(userId);
  }

  /**
   * Get a workspaces audit logs, accessible by super admins and workspace
   * admins
   * @param userId the users id
   * @param workspaceId the workspace id
   */
  @Permissions(Action.ManageWorkspace)
  @Get('workspaces/:workspaceId/audit')
  @UseInterceptors(WorkspaceInterceptor)
  @ApiQuery({ name: 'userId', description: 'The users id' })
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiOperation({ summary: 'Get a workspaces audit logs' })
  @ApiOkResponse({
    description: 'The audit logs have been successfully retrieved',
    type: AuditLogDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided workspace id or user id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace with the given id was not found',
    type: ExceptionDto,
  })
  findAllWorkspace(
    @Query('userId') userId: string,
    @Param('workspaceId') workspaceId: string,
  ): Promise<AuditLogDocument[]> {
    return this.auditingService.findAll(userId, workspaceId);
  }
}
