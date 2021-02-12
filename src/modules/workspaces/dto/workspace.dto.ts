import { UserDto } from './../../users/dto/user.dto';
import { Exclude, Expose } from 'class-transformer';

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
  readonly resources?: WorkspaceResourcesDto;
}

@Exclude()
export class WorkspaceDto {
  @Expose()
  readonly id: string;

  @Expose()
  readonly name: string;

  @Expose()
  readonly properties?: WorkspacePropertiesDto;

  @Expose()
  readonly users: UserDto[];
}
