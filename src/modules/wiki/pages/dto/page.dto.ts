import { WorkspaceDto } from './../../../workspaces/dto/workspace.dto';
import { UserDto } from './../../../users/dto/user.dto';
import { WikiSectionDto } from './../../sections/dto/section.dto';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class WikiPageDto {
  @Expose()
  readonly id: string;

  @Expose()
  readonly title: string;

  @Expose()
  readonly body: string;

  @Expose()
  readonly workspace: WorkspaceDto;

  @Expose()
  readonly user: UserDto;

  @Expose()
  readonly section: WikiSectionDto;
}
