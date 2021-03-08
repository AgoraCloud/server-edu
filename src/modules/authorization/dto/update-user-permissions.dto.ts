import { IsArrayLength } from '../../../utils/dto-validators';
import { IsIn, IsNotEmpty, IsString, Validate } from 'class-validator';
import { Role, Action, WorkspaceActions } from './../schemas/permission.schema';

export class UpdateUserPermissionsDto {
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Validate(IsArrayLength, [1], {
    message: 'a user must have one role only',
  })
  @IsIn([Role.User, Role.SuperAdmin], { each: true })
  roles: [Role.User | Role.SuperAdmin];

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsIn(WorkspaceActions, { each: true })
  permissions: Action[];
}
