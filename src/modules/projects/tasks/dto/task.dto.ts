import { ProjectLaneDto } from './../../lanes/dto/lane.dto';
import { ProjectDto } from './../../dto/project.dto';
import { WorkspaceDto } from './../../../workspaces/dto/workspace.dto';
import { UserDto } from './../../../users/dto/user.dto';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ProjectTaskDto {
  @Expose()
  readonly id: string;

  @Expose()
  readonly title: string;

  @Expose()
  readonly description?: string;

  @Expose()
  readonly user: UserDto;

  @Expose()
  readonly workspace: WorkspaceDto;

  @Expose()
  readonly project: ProjectDto;

  @Expose()
  readonly lane: ProjectLaneDto;
}
