import { UserDto } from './../../../users/dto/user.dto';
import { WorkspaceDto } from './../../../workspaces/dto/workspace.dto';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class WikiSectionDto {
  @Expose()
  name: string;

  @Expose()
  workspace: WorkspaceDto;

  @Expose()
  user: UserDto;
}
