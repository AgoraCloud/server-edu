import { UserDto } from './../../users/dto/user.dto';
import { WorkspaceDto } from './../../workspaces/dto/workspace.dto';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class DeploymentResourcesDto {
  @Expose()
  cpuCount: number;

  @Expose()
  memoryCount: number;

  @Expose()
  storageCount?: number;
}

@Exclude()
export class DeploymentImageDto {
  @Expose()
  name: string;

  @Expose()
  tag: string;
}

@Exclude()
export class DeploymentPropertiesDto {
  @Expose()
  image: DeploymentImageDto;

  @Expose()
  resources: DeploymentResourcesDto;
}

@Exclude()
export class DeploymentDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  status: string;

  @Expose()
  failureReason?: string;

  @Expose()
  properties: DeploymentPropertiesDto;

  @Expose()
  workspace: WorkspaceDto;

  @Expose()
  user: UserDto;
}
