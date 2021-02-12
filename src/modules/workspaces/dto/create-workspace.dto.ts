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
  readonly cpuCount?: number;

  @Min(2)
  @IsInt()
  @IsOptional()
  readonly memoryCount?: number;

  @Min(8)
  @IsInt()
  @IsOptional()
  readonly storageCount?: number;
}

export class CreateWorkspacePropertiesDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateWorkspaceResourcesDto)
  readonly resources?: CreateWorkspaceResourcesDto;
}

export class CreateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  readonly name: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateWorkspacePropertiesDto)
  readonly properties?: CreateWorkspacePropertiesDto;
}
