import { NotFoundException } from '@nestjs/common';

/**
 * An exception that is thrown when the wiki page with the given id
 * was not found
 */
export class WikiPageNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Wiki page with id ${id} not found`);
  }
}
