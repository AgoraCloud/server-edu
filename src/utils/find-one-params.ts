import { IsMongoId } from 'class-validator';

/**
 * A DTO with an id query parameter
 */
export class FindOneParams {
  @IsMongoId()
  id: string;
}
