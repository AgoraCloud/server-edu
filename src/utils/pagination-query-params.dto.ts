import { IsOptional, IsNumberString, IsNotEmpty } from 'class-validator';

/**
 * A DTO with pagination query parameters
 */
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
