import { IsNotEmpty, IsString, MinLength, IsEmail } from 'class-validator';

export class SignInDto {
  @IsEmail()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  readonly password: string;
}
