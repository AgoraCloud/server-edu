import { deploymentImages } from './../deployment-images';
import {
  DeploymentImage,
  DeploymentType,
} from './../schemas/deployment.schema';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
  IsBoolean,
  IsEnum,
} from 'class-validator';

/**
 * Validates the given deployment image
 */
@ValidatorConstraint({ name: 'isValidDeploymentImage', async: false })
class IsValidDeploymentImage implements ValidatorConstraintInterface {
  validate(image: DeploymentImage): boolean {
    return (
      image &&
      image.type &&
      image.version &&
      deploymentImages.findIndex(
        (i) => i.type === image.type && i.version === image.version,
      ) !== -1
    );
  }

  defaultMessage() {
    return 'image is not one of the allowed deployment images';
  }
}

export class CreateDeploymentImageDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(DeploymentType)
  readonly type: DeploymentType;

  @IsString()
  @IsNotEmpty()
  readonly version: string;
}

export class CreateDeploymentResourcesDto {
  @Min(1)
  @IsInt()
  readonly cpuCount: number;

  @Min(2)
  @IsInt()
  readonly memoryCount: number;

  @Min(8)
  @IsInt()
  @IsOptional()
  readonly storageCount: number;
}

export class CreateDeploymentPropertiesDto {
  @IsBoolean()
  @IsOptional()
  readonly isFavorite?: boolean;

  @IsDefined()
  @ValidateNested()
  @Type(() => CreateDeploymentImageDto)
  @Validate(IsValidDeploymentImage)
  readonly image: CreateDeploymentImageDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => CreateDeploymentResourcesDto)
  readonly resources: CreateDeploymentResourcesDto;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  sudoPassword: string;
}

export class CreateDeploymentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  readonly name: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => CreateDeploymentPropertiesDto)
  readonly properties: CreateDeploymentPropertiesDto;
}
