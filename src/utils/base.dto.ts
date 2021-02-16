import { Expose } from 'class-transformer';

export class BaseDto {
  @Expose({ name: '_id' })
  readonly id: string;
}
