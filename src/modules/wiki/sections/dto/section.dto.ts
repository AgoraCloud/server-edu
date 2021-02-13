import { UserDto } from './../../../users/dto/user.dto';
import { WorkspaceDto } from './../../../workspaces/dto/workspace.dto';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class WikiSectionDto {
  @Expose()
  readonly id: string;

  @Expose()
  readonly name: string;

  @Expose()
  readonly workspace: WorkspaceDto;

  @Expose()
  readonly user: UserDto;
}
