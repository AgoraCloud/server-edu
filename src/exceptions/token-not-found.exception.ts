import { NotFoundException } from '@nestjs/common';

export class TokenNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Token with id ${id} not found`);
  }
}
