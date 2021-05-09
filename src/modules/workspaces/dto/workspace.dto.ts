import { IdWithTimestampDto } from './../../../utils/base.dto';
import { UserDto } from './../../users/dto/user.dto';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class WorkspaceResourcesDto {
  @Expose()
  readonly cpuCount?: number;

  @Expose()
  readonly memoryCount?: number;

  @Expose()
  readonly storageCount?: number;
}

@Exclude()
export class WorkspacePropertiesDto {
  @Expose()
  @Type(() => WorkspaceResourcesDto)
  readonly resources?: WorkspaceResourcesDto;
}

@Exclude()
export class WorkspaceDto extends IdWithTimestampDto {
  @Expose()
  readonly name: string;

  @Expose()
  @Type(() => WorkspacePropertiesDto)
  readonly properties?: WorkspacePropertiesDto;

  @Expose()
  @Type(() => UserDto)
  readonly users: UserDto[];
}
