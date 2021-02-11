import { UserDto } from './../../users/dto/user.dto';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class WorkspaceDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  users: UserDto[];
}
