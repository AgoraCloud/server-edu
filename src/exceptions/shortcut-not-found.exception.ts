import { NotFoundException } from '@nestjs/common';

/**
 * An exception that is thrown when a shortcut with the given id
 * was not found
 */
export class ShortcutNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Shortcut with id ${id} not found`);
  }
}
