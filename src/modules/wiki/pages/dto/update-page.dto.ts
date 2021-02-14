import { IsOptional, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateWikiPageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @IsOptional()
  readonly title: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly body: string;
}
