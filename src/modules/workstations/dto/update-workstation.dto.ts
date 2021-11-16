import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  MinLength,
  ValidateNested,
  Min,
  IsInt,
} from 'class-validator';

export class UpdateWorkstationUserDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(4)
  @ApiProperty({ minLength: 4, required: false })
  readonly fullName?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(8)
  @ApiProperty({ minLength: 8, required: false })
  readonly password?: string;

  constructor(obj: UpdateWorkstationUserDto) {
    Object.assign(this, obj);
  }
}

export class UpdateWorkstationPropertiesDto {
  @Min(1)
  @IsInt()
  @IsOptional()
  @ApiProperty({ minimum: 1, required: false })
  readonly cpuCount?: number;

  @Min(2)
  @IsInt()
  @IsOptional()
  @ApiProperty({ minimum: 2, required: false })
  readonly memoryCount?: number;

  constructor(obj: UpdateWorkstationPropertiesDto) {
    Object.assign(this, obj);
  }
}

export class UpdateWorkstationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @IsOptional()
  @ApiProperty({ minLength: 1, required: false })
  readonly name?: string;

  @IsOptional()
  @ValidateNested()
  @ApiProperty({ required: false })
  @Type(() => UpdateWorkstationUserDto)
  readonly user?: UpdateWorkstationUserDto;

  @IsOptional()
  @ValidateNested()
  @ApiProperty({ required: false })
  @Type(() => UpdateWorkstationPropertiesDto)
  readonly properties?: UpdateWorkstationPropertiesDto;

  constructor(obj: UpdateWorkstationDto) {
    Object.assign(this, obj);
  }
}
