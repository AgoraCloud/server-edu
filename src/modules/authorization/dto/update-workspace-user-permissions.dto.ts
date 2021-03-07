import { IsArrayLength } from './../../../utils/dto-validators';
import { IsIn, IsNotEmpty, IsString, Validate } from 'class-validator';
import {
  Role,
  InWorkspaceActions,
  Action,
} from './../schemas/permission.schema';

export class UpdateWorkspaceUserPermissionsDto {
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Validate(IsArrayLength, [1], {
    message: 'a user must have one role only',
  })
  @IsIn([Role.User, Role.WorkspaceAdmin], { each: true })
  roles: [Role.User | Role.WorkspaceAdmin];

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsIn(InWorkspaceActions, { each: true })
  permissions: Action[];
}
