import { BaseDto } from './../../../../utils/base.dto';
import { UserDto } from './../../../users/dto/user.dto';
import { WorkspaceDto } from './../../../workspaces/dto/workspace.dto';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class WikiSectionDto extends BaseDto {
  @Expose()
  readonly name: string;

  @Expose()
  readonly createdAt: Date;

  @Expose()
  readonly updatedAt: Date;

  @Expose()
  @Type(() => WorkspaceDto)
  readonly workspace: WorkspaceDto;

  @Expose()
  @Type(() => UserDto)
  readonly user: UserDto;
}
