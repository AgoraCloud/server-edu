import { WorkspaceDto } from './../../workspaces/dto/workspace.dto';
import { UserDto } from './../../users/dto/user.dto';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ProjectDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  user: UserDto;

  @Expose()
  workspace: WorkspaceDto;
}
