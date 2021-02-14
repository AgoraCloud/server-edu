import { ProjectDto } from './../../dto/project.dto';
import { WorkspaceDto } from './../../../workspaces/dto/workspace.dto';
import { UserDto } from './../../../users/dto/user.dto';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ProjectLaneDto {
  @Expose()
  readonly id: string;

  @Expose()
  readonly name: string;

  @Expose()
  readonly user: UserDto;

  @Expose()
  readonly workspace: WorkspaceDto;

  @Expose()
  readonly project: ProjectDto;
}
