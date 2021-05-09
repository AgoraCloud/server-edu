import { BadRequestException } from '@nestjs/common';

/**
 * An exception that is thrown when a token is expired
 */
export class TokenExpiredException extends BadRequestException {
  constructor(id: string) {
    super(`Token with id ${id} is expired`);
  }
}
