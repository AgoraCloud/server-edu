import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProjectTaskDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  readonly title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @IsOptional()
  readonly description?: string;
}
