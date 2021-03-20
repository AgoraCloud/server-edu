import { WorkspaceDto } from './../../workspaces/dto/workspace.dto';
import { UserDto } from './../../users/dto/user.dto';
import { Action } from './../../authorization/schemas/permission.schema';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class AuditLogDto {
  @Expose()
  isSuccessful: boolean;

  @Expose()
  actions: Action[];

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
