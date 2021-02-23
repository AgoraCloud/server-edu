import { BaseDto } from './../../../../utils/base.dto';
import { ProjectDto } from './../../dto/project.dto';
import { WorkspaceDto } from './../../../workspaces/dto/workspace.dto';
import { UserDto } from './../../../users/dto/user.dto';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class ProjectLaneDto extends BaseDto {
  @Expose()
  readonly name: string;

  @Expose()
  @Type(() => UserDto)
  readonly user: UserDto;

  @Expose()
  @Type(() => WorkspaceDto)
  readonly workspace: WorkspaceDto;

  @Expose()
  @Type(() => ProjectDto)
  readonly project: ProjectDto;
}
