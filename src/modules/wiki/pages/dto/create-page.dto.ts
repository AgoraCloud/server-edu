import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateWikiPageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  readonly title: string;

  @IsString()
  @IsNotEmpty()
  readonly body: string;
}
