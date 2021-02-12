import { UserDto } from './../../users/dto/user.dto';
import { WorkspaceDto } from './../../workspaces/dto/workspace.dto';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class DeploymentResourcesDto {
  @Expose()
  readonly cpuCount: number;

  @Expose()
  readonly memoryCount: number;

  @Expose()
  readonly storageCount?: number;
}

@Exclude()
export class DeploymentImageDto {
  @Expose()
  readonly name: string;

  @Expose()
  readonly tag: string;
}

@Exclude()
export class DeploymentPropertiesDto {
  @Expose()
  readonly image: DeploymentImageDto;

  @Expose()
  readonly resources: DeploymentResourcesDto;
}

@Exclude()
export class DeploymentDto {
  @Expose()
  readonly id: string;

  @Expose()
  readonly name: string;

  @Expose()
  readonly status: string;

  @Expose()
  readonly failureReason?: string;

  @Expose()
  readonly properties: DeploymentPropertiesDto;

  @Expose()
  readonly workspace: WorkspaceDto;

  @Expose()
  readonly user: UserDto;
}
