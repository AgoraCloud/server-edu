import { BadRequestException } from '@nestjs/common';

/**
 * An exception that is thrown when the given id is not a valid
 * MongoDB id
 */
export class InvalidMongoIdException extends BadRequestException {
  constructor(id: string) {
    super([`${id} must be a mongodb id`]);
  }
}
