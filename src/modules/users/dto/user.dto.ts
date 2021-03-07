import { BaseDto } from './../../../utils/base.dto';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserDto extends BaseDto {
  @Expose()
  readonly fullName: string;

  @Expose()
  readonly email: string;
}
