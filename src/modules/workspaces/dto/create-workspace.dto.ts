import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  readonly name: string;
}
