import { BaseDto } from './../../../../utils/base.dto';
import { WorkspaceDto } from './../../../workspaces/dto/workspace.dto';
import { UserDto } from './../../../users/dto/user.dto';
import { WikiSectionDto } from './../../sections/dto/section.dto';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class WikiPageDto extends BaseDto {
  @Expose()
  readonly title: string;

  @Expose()
  readonly body: string;

  @Expose()
  @Type(() => WorkspaceDto)
  readonly workspace: WorkspaceDto;

  @Expose()
  @Type(() => UserDto)
  readonly user: UserDto;

  @Expose()
  @Type(() => WikiSectionDto)
  readonly section: WikiSectionDto;
}
