import { UserDto } from './../../users/dto/user.dto';
import { Action, Role } from './../schemas/permission.schema';
import { Exclude, Expose, Transform, Type } from 'class-transformer';

@Exclude()
export class RolesAndPermissionsDto {
  @Expose()
  roles: Role[];

  @Expose()
  permissions: Action[];
}

@Exclude()
export class PermissionDto extends RolesAndPermissionsDto {
  @Expose()
  @Type(() => UserDto)
  readonly user: UserDto;

  @Expose()
  @Type(() => Object)
  @Transform((value) => mapToJson(value))
  workspaces: Map<string, RolesAndPermissionsDto>;
}

/**
 * Converts a map to JSON
 * @param map the map to convert
 * @returns json map
 */
const mapToJson = (map: Map<string, RolesAndPermissionsDto>) => {
  const obj = {};
  map.forEach((value: RolesAndPermissionsDto, key: string) => {
    obj[key] = value;
  });
  return obj;
};
