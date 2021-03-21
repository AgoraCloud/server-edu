import { PaginationQueryParamsDto } from './../../../utils/pagination-query-params.dto';
import {
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsBooleanString,
} from 'class-validator';
import { AuditResource, AuditAction } from './../schemas/audit-log.schema';

export class AuditLogQueryParamsDto extends PaginationQueryParamsDto {
  @IsNotEmpty()
  @IsOptional()
  @IsBooleanString()
  readonly isSuccessful?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @IsIn([
    AuditAction.Create,
    AuditAction.Read,
    AuditAction.ReadImages,
    AuditAction.ReadLogs,
    AuditAction.ReadMetrics,
    AuditAction.Proxy,
    AuditAction.Update,
    AuditAction.Delete,
    AuditAction.LogIn,
    AuditAction.LogOut,
    AuditAction.AddUser,
    AuditAction.RemoveUser,
  ])
  readonly action?: AuditAction;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @IsIn([
    AuditResource.User,
    AuditResource.Permission,
    AuditResource.AuditLog,
    AuditResource.Workspace,
    AuditResource.Deployment,
    AuditResource.Project,
    AuditResource.ProjectLane,
    AuditResource.ProjectTask,
    AuditResource.WikiSection,
    AuditResource.WikiPage,
  ])
  readonly resource?: AuditResource;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  readonly userAgent?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  readonly ip?: string;

  @IsString()
  @IsMongoId()
  @IsNotEmpty()
  @IsOptional()
  readonly userId?: string;

  @IsString()
  @IsMongoId()
  @IsNotEmpty()
  @IsOptional()
  readonly workspaceId?: string;
}
