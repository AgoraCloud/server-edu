import { BaseDto } from './../../../utils/base.dto';
import { WorkspaceDto } from './../../workspaces/dto/workspace.dto';
import { UserDto } from './../../users/dto/user.dto';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class ProjectDto extends BaseDto {
  @Expose()
  readonly name: string;

  @Expose()
  readonly description: string;

  @Expose()
  readonly createdAt: Date;

  @Expose()
  readonly updatedAt: Date;

  @Expose()
  @Type(() => UserDto)
  readonly user: UserDto;

  @Expose()
  @Type(() => WorkspaceDto)
  readonly workspace: WorkspaceDto;
}
