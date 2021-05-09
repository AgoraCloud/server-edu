import { IdWithTimestampDto } from './../../../utils/base.dto';
import { WorkspaceDto } from './../../workspaces/dto/workspace.dto';
import { UserDto } from './../../users/dto/user.dto';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class ProjectDto extends IdWithTimestampDto {
  @Expose()
  readonly name: string;

  @Expose()
  readonly description: string;

  @Expose()
  @Type(() => UserDto)
  readonly user: UserDto;

  @Expose()
  @Type(() => WorkspaceDto)
  readonly workspace: WorkspaceDto;
}
