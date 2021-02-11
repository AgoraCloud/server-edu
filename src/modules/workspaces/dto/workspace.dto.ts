import { UserDto } from './../../users/dto/user.dto';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class WorkspaceResourcesDto {
  @Expose()
  cpuCount?: number;

  @Expose()
  memoryCount?: number;

  @Expose()
  storageCount?: number;
}

@Exclude()
export class WorkspacePropertiesDto {
  @Expose()
  resources?: WorkspaceResourcesDto;
}

@Exclude()
export class WorkspaceDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  properties?: WorkspacePropertiesDto;

  @Expose()
  users: UserDto[];
}
