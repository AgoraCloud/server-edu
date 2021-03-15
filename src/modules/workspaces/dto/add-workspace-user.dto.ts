import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class AddWorkspaceUserDto {
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  readonly id: string;
}
