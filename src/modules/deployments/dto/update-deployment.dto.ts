import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  Min,
  IsInt,
  ValidateNested,
} from 'class-validator';

export class UpdateDeploymentResourcesDto {
  @Min(1)
  @IsInt()
  @IsOptional()
  cpuCount: number;

  @Min(2)
  @IsInt()
  @IsOptional()
  memoryCount: number;
}

export class UpdateDeploymentPropertiesDto {
  @ValidateNested()
  @Type(() => UpdateDeploymentResourcesDto)
  @IsOptional()
  resources: UpdateDeploymentResourcesDto;
}

export class UpdateDeploymentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @IsOptional()
  name: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateDeploymentPropertiesDto)
  properties?: UpdateDeploymentPropertiesDto;
}
