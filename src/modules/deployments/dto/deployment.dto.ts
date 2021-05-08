import { BaseDto } from './../../../utils/base.dto';
import {
  DeploymentStatus,
  DeploymentType,
} from './../schemas/deployment.schema';
import { UserDto } from './../../users/dto/user.dto';
import { WorkspaceDto } from './../../workspaces/dto/workspace.dto';
import { Exclude, Expose, Type } from 'class-transformer';

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
  readonly type: DeploymentType;

  @Expose()
  readonly version: string;
}

@Exclude()
export class DeploymentPropertiesDto {
  @Expose()
  readonly isFavorite?: boolean;

  @Expose()
  @Type(() => DeploymentImageDto)
  readonly image: DeploymentImageDto;

  @Expose()
  @Type(() => DeploymentResourcesDto)
  readonly resources: DeploymentResourcesDto;
}

@Exclude()
export class DeploymentDto extends BaseDto {
  @Expose()
  readonly name: string;

  @Expose()
  readonly status: DeploymentStatus;

  @Expose()
  readonly failureReason?: string;

  @Expose()
  readonly createdAt: Date;

  @Expose()
  readonly updatedAt: Date;

  @Expose()
  @Type(() => DeploymentPropertiesDto)
  readonly properties: DeploymentPropertiesDto;

  @Expose()
  @Type(() => WorkspaceDto)
  readonly workspace: WorkspaceDto;

  @Expose()
  @Type(() => UserDto)
  readonly user: UserDto;
}
