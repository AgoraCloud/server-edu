import { NotFoundException } from '@nestjs/common';

/**
 * An exception that is thrown when the token with the given id
 * was not found
 */
export class TokenNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Token with id ${id} not found`);
  }
}
