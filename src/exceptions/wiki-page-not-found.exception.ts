import { NotFoundException } from '@nestjs/common';

export class WikiPageNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Wiki page with id ${id} not found`);
  }
}
