import {
  AuditResource,
  CustomAuditResourceDto,
} from './custom-audit-resource.dto';
import { PaginationQueryParamsDto } from './../../../utils/pagination-query-params.dto';
import {
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsBooleanString,
} from 'class-validator';
import { AuditActionDto, AuditResourceDto } from '@agoracloud/common';

export class AuditLogQueryParamsDto extends PaginationQueryParamsDto {
  @IsNotEmpty()
  @IsOptional()
  @IsBooleanString()
  readonly isSuccessful?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @IsIn([
    AuditActionDto.Create,
    AuditActionDto.Read,
    AuditActionDto.ReadImages,
    AuditActionDto.ReadLogs,
    AuditActionDto.ReadMetrics,
    AuditActionDto.Proxy,
    AuditActionDto.Update,
    AuditActionDto.Delete,
    AuditActionDto.LogIn,
    AuditActionDto.LogOut,
    AuditActionDto.AddUser,
    AuditActionDto.RemoveUser,
  ])
  readonly action?: AuditActionDto;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @IsIn([
    AuditResourceDto.User,
    AuditResourceDto.Permission,
    AuditResourceDto.AuditLog,
    AuditResourceDto.Workspace,
    AuditResourceDto.Deployment,
    AuditResourceDto.Project,
    AuditResourceDto.ProjectLane,
    AuditResourceDto.ProjectTask,
    AuditResourceDto.WikiSection,
    AuditResourceDto.WikiPage,
    AuditResourceDto.Shortcut,
    CustomAuditResourceDto.Workstation,
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
