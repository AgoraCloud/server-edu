import { BadRequestException } from '@nestjs/common';

export class TokenExpiredException extends BadRequestException {
  constructor(id: string) {
    super(`Token with id ${id} is expired`);
  }
}
