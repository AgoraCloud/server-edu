import { NotFoundException } from '@nestjs/common';

export class WikiSectionNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Wiki section with id ${id} not found`);
  }
}
