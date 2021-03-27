import { AuditAction, AuditResource } from './../schemas/audit-log.schema';
import { WorkspaceDto } from './../../workspaces/dto/workspace.dto';
import { UserDto } from './../../users/dto/user.dto';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class AuditLogDto {
  @Expose()
  isSuccessful: boolean;

  @Expose()
  failureReason?: string;

  @Expose()
  action: AuditAction;

  @Expose()
  resource: AuditResource;

  @Expose({ name: 'createdAt' })
  date: Date;

  @Expose()
  userAgent: string;

  @Expose()
  ip: string;

  @Expose()
  @Type(() => UserDto)
  user: UserDto;

  @Expose()
  @Type(() => WorkspaceDto)
  workspace?: WorkspaceDto;
}
