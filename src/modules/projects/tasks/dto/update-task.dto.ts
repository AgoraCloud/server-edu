import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProjectTaskDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @IsOptional()
  readonly title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @IsOptional()
  readonly description?: string;
}
