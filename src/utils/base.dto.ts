import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * A DTO with the id
 */
class IdDto {
  @Expose({ name: '_id' })
  readonly id: string;
}

/**
 * A DTO with the id, createdAt and updatedAt fields
 */
class IdWithTimestampDto implements IdDto {
  @Expose({ name: '_id' })
  readonly id: string;

  @Expose()
  readonly createdAt: Date;

  @Expose()
  readonly updatedAt: Date;
}

/**
 * A DTO that represents the server response when an exception is
 * thrown
 */
class ExceptionDto {
  statusCode: number;
  @ApiProperty({ oneOf: [{ type: 'string' }, { type: '[string]' }] })
  message: string | string[];
  error: string;
}

export { IdDto, IdWithTimestampDto, ExceptionDto };
