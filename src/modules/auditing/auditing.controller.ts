import { AuditLogDto } from './dto/audit-log.dto';
import { TransformInterceptor } from './../../interceptors/transform.interceptor';
import { AuditLogDocument } from './schemas/audit-log.schema';
import { WorkspaceInterceptor } from './../../interceptors/workspace.interceptor';
import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { Auth } from '../../decorators/auth.decorator';
import { Permissions } from '../../decorators/permissions.decorator';
import { Action } from '../authorization/schemas/permission.schema';
import { AuditingService } from './auditing.service';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';

@ApiCookieAuth()
@ApiTags('Auditing')
@Auth()
@Controller('api')
@UseInterceptors(new TransformInterceptor(AuditLogDto))
export class AuditingController {
  constructor(private readonly auditingService: AuditingService) {}

  // TODO: add comments and tags
  @Get('audit')
  @Permissions(Action.ManageUser)
  findAll(@Query('userId') userId: string): Promise<AuditLogDocument[]> {
    return this.auditingService.findAll(userId);
  }

  // TODO: add comments and tags
  @Permissions(Action.ManageWorkspace)
  @Get('workspaces/:workspaceId/audit')
  @UseInterceptors(WorkspaceInterceptor)
  findAllWorkspace(
    @Query('userId') userId: string,
    @Param('workspaceId') workspaceId: string,
  ): Promise<AuditLogDocument[]> {
    return this.auditingService.findAll(userId, workspaceId);
  }
}
