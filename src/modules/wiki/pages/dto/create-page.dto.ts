import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateWikiPageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;
}
