import { IdWithTimestampDto } from './../../../../utils/base.dto';
import { ProjectLaneDto } from './../../lanes/dto/lane.dto';
import { ProjectDto } from './../../dto/project.dto';
import { WorkspaceDto } from './../../../workspaces/dto/workspace.dto';
import { UserDto } from './../../../users/dto/user.dto';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class ProjectTaskDto extends IdWithTimestampDto {
  @Expose()
  readonly title: string;

  @Expose()
  readonly description?: string;

  @Expose()
  @Type(() => UserDto)
  readonly user: UserDto;

  @Expose()
  @Type(() => WorkspaceDto)
  readonly workspace: WorkspaceDto;

  @Expose()
  @Type(() => ProjectDto)
  readonly project: ProjectDto;

  @Expose()
  @Type(() => ProjectLaneDto)
  readonly lane: ProjectLaneDto;
}
