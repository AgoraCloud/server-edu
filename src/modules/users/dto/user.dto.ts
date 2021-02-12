import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserDto {
  @Expose()
  readonly id: string;

  @Expose()
  readonly fullName: string;

  @Expose()
  readonly email: string;

  @Expose()
  readonly isAdmin: boolean;
}
