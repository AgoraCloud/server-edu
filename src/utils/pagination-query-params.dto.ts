import { IsOptional, IsNumberString, IsNotEmpty } from 'class-validator';

export class PaginationQueryParamsDto {
  @IsOptional()
  @IsNotEmpty()
  @IsNumberString()
  readonly take?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsNumberString()
  readonly skip?: string;
}
