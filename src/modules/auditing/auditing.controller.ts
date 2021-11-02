import { CustomAuditResourceDto } from './dto/custom-audit-resource.dto';
import {
  ExceptionDto,
  AuditLogDto,
  ActionDto,
  AuditActionDto,
  AuditResourceDto,
} from '@agoracloud/common';
import { AuditLogDocument } from './schemas/audit-log.schema';
import { WorkspaceInterceptor } from './../../interceptors/workspace.interceptor';
import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { Auth } from '../../decorators/auth.decorator';
import { Permissions } from '../../decorators/permissions.decorator';
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
import { Audit } from '../../decorators/audit.decorator';
import { AuditLogQueryParamsDto } from './dto/audit-log-query-params.dto';
import { Transform } from '../../decorators/transform.decorator';

@ApiCookieAuth()
@ApiTags('Auditing')
@Auth()
@Controller('api')
@Transform(AuditLogDto)
export class AuditingController {
  constructor(private readonly auditingService: AuditingService) {}

  /**
   * Get all audit logs, accessible by super admins only
   * @param userId the users id
   */
  @Get('audit')
  @Permissions(ActionDto.ManageUser)
  @Audit(AuditActionDto.Read, AuditResourceDto.AuditLog)
  @ApiQuery({
    name: 'isSuccessful',
    description: 'The isSuccessful paramter in the audit log',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'action',
    description: 'The action in the audit log',
    required: false,
    enum: AuditActionDto,
  })
  @ApiQuery({
    name: 'resource',
    description: 'The resource in the audit log',
    required: false,
    enum: AuditResourceDto && CustomAuditResourceDto,
  })
  @ApiQuery({
    name: 'userAgent',
    description: 'The user agent in the audit log',
    required: false,
  })
  @ApiQuery({
    name: 'ip',
    description: 'The ip address in the audit log',
    required: false,
  })
  @ApiQuery({
    name: 'userId',
    description: 'The user id in the audit log',
    required: false,
  })
  @ApiQuery({
    name: 'workspaceId',
    description: 'The workspace id in the audit log',
    required: false,
  })
  @ApiQuery({
    name: 'take',
    description: 'The number of audit logs to return',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'skip',
    description: 'The number of audit logs to skip',
    required: false,
    type: Number,
  })
  @ApiOperation({ summary: 'Get all audit logs' })
  @ApiOkResponse({
    description: 'The audit logs have been successfully retrieved',
    type: AuditLogDto,
  })
  @ApiBadRequestResponse({
    description:
      'The provided user id was not valid or the provided query param(s) was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  findAll(
    @Query() auditLogQueryParamsDto: AuditLogQueryParamsDto,
  ): Promise<AuditLogDocument[]> {
    return this.auditingService.findAll(auditLogQueryParamsDto);
  }

  /**
   * Get a workspaces audit logs, accessible by super admins and workspace
   * admins
   * @param userId the users id
   * @param workspaceId the workspace id
   */
  @Permissions(ActionDto.ManageWorkspace)
  @Get('workspaces/:workspaceId/audit')
  @UseInterceptors(WorkspaceInterceptor)
  @Audit(AuditActionDto.Read, AuditResourceDto.AuditLog)
  @ApiParam({ name: 'workspaceId', description: 'The workspace id' })
  @ApiQuery({
    name: 'isSuccessful',
    description: 'The isSuccessful paramter in the audit log',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'action',
    description: 'The action in the audit log',
    required: false,
    enum: AuditActionDto,
  })
  @ApiQuery({
    name: 'resource',
    description: 'The resource in the audit log',
    required: false,
    enum: AuditResourceDto && CustomAuditResourceDto,
  })
  @ApiQuery({
    name: 'userAgent',
    description: 'The user agent in the audit log',
    required: false,
  })
  @ApiQuery({
    name: 'ip',
    description: 'The ip address in the audit log',
    required: false,
  })
  @ApiQuery({
    name: 'userId',
    description: 'The user id in the audit log',
    required: false,
  })
  @ApiQuery({
    name: 'take',
    description: 'The number of audit logs to return',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'skip',
    description: 'The number of audit logs to skip',
    required: false,
    type: Number,
  })
  @ApiOperation({ summary: 'Get a workspaces audit logs' })
  @ApiOkResponse({
    description: 'The audit logs have been successfully retrieved',
    type: AuditLogDto,
  })
  @ApiBadRequestResponse({
    description:
      'The provided workspace id or user id was not valid or the provided query param(s) was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workspace with the given id was not found',
    type: ExceptionDto,
  })
  findAllWorkspace(
    @Query() auditLogQueryParamsDto: AuditLogQueryParamsDto,
    @Param('workspaceId') workspaceId: string,
  ): Promise<AuditLogDocument[]> {
    return this.auditingService.findAll({
      ...auditLogQueryParamsDto,
      workspaceId,
    });
  }
}
