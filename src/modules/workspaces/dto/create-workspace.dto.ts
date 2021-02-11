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

export class CreateWorkspaceResourcesDto {
  @Min(1)
  @IsInt()
  @IsOptional()
  cpuCount?: number;

  @Min(2)
  @IsInt()
  @IsOptional()
  memoryCount?: number;

  @Min(8)
  @IsInt()
  @IsOptional()
  storageCount?: number;
}

export class CreateWorkspacePropertiesDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateWorkspaceResourcesDto)
  resources?: CreateWorkspaceResourcesDto;
}

export class CreateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  readonly name: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateWorkspacePropertiesDto)
  properties?: CreateWorkspacePropertiesDto;
}
