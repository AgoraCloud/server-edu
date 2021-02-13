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
  readonly cpuCount?: number;

  @Min(0)
  @IsInt()
  @IsOptional()
  readonly memoryCount?: number;

  @Min(0)
  @IsInt()
  @IsOptional()
  readonly storageCount?: number;
}

export class UpdateWorkspacePropertiesDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateWorkspaceResourcesDto)
  readonly resources?: UpdateWorkspaceResourcesDto;
}

export class UpdateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @IsOptional()
  readonly name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateWorkspacePropertiesDto)
  readonly properties?: UpdateWorkspacePropertiesDto;
}
