import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class UpdateWorkspaceResourcesDto {
  @Min(0)
  @IsInt()
  @IsOptional()
  cpuCount?: number;

  @Min(0)
  @IsInt()
  @IsOptional()
  memoryCount?: number;

  @Min(0)
  @IsInt()
  @IsOptional()
  storageCount?: number;
}

export class UpdateWorkspacePropertiesDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateWorkspaceResourcesDto)
  resources?: UpdateWorkspaceResourcesDto;
}

export class UpdateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @IsOptional()
  name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateWorkspacePropertiesDto)
  properties?: UpdateWorkspacePropertiesDto;
}
