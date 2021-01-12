import { BadRequestException } from '@nestjs/common';

export class InvalidMongoIdException extends BadRequestException {
  constructor(id: string) {
    super([`${id} must be a mongodb id`]);
  }
}
