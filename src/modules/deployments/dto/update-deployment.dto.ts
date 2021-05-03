import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  Min,
  IsInt,
  ValidateNested,
  IsBoolean,
} from 'class-validator';

export class UpdateDeploymentResourcesDto {
  @Min(1)
  @IsInt()
  @IsOptional()
  readonly cpuCount?: number;

  @Min(2)
  @IsInt()
  @IsOptional()
  readonly memoryCount?: number;
}

export class UpdateDeploymentPropertiesDto {
  @IsBoolean()
  @IsOptional()
  readonly isFavorite?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateDeploymentResourcesDto)
  readonly resources?: UpdateDeploymentResourcesDto;
}

export class UpdateDeploymentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @IsOptional()
  readonly name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateDeploymentPropertiesDto)
  readonly properties?: UpdateDeploymentPropertiesDto;
}
