import { BaseDto } from './../../../utils/base.dto';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserDto extends BaseDto {
  @Expose()
  readonly fullName: string;

  @Expose()
  readonly email: string;
}

@Exclude()
export class AdminUserDto extends UserDto {
  @Expose()
  readonly isEnabled: boolean;

  @Expose()
  readonly isVerified: boolean;
}
