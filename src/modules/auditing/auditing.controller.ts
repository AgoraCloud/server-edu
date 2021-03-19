import { AuditDocument } from './schemas/audit.schema';
import { WorkspaceInterceptor } from './../../interceptors/workspace.interceptor';
import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { Auth } from '../../decorators/auth.decorator';
import { Permissions } from 'src/decorators/permissions.decorator';
import { Action } from '../authorization/schemas/permission.schema';
import { AuditingService } from './auditing.service';

// TODO: add tags
@Auth()
@Controller('api')
export class AuditingController {
  constructor(private readonly auditingService: AuditingService) {}

  // TODO: add comments and tags
  @Get('audit')
  @Permissions(Action.ManageUser)
  findAll(@Query('userId') userId: string): Promise<AuditDocument[]> {
    return this.auditingService.findAll(userId);
  }

  // TODO: add comments and tags
  @Permissions(Action.ManageWorkspace)
  @Get('workspaces/:workspaceId/audit')
  @UseInterceptors(WorkspaceInterceptor)
  findAllWorkspace(
    @Query('userId') userId: string,
    @Param('workspaceId') workspaceId: string,
  ): Promise<AuditDocument[]> {
    return this.auditingService.findAll(userId, workspaceId);
  }
}
