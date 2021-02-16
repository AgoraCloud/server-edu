import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class BaseDto {
  @Expose({ name: '_id' })
  readonly id: string;
}

export class ExceptionDto {
  statusCode: number;
  @ApiProperty({ oneOf: [{ type: 'string' }, { type: '[string]' }] })
  message: string | string[];
  error: string;
}
