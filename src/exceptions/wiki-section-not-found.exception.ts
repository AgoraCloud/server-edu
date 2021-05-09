import { NotFoundException } from '@nestjs/common';

/**
 * An exception that is thrown when the wiki section with the given id
 * was not found
 */
export class WikiSectionNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Wiki section with id ${id} not found`);
  }
}
