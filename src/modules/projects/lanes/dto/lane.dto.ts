import { ProjectDto } from './../../dto/project.dto';
import { WorkspaceDto } from './../../../workspaces/dto/workspace.dto';
import { UserDto } from './../../../users/dto/user.dto';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ProjectLaneDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  user: UserDto;

  @Expose()
  workspace: WorkspaceDto;

  @Expose()
  project: ProjectDto;
}
