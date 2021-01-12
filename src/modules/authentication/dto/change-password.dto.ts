import { IsMongoId, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  readonly password: string;

  @IsMongoId()
  readonly token: string;
}
