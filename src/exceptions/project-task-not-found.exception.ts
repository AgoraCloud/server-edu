import { NotFoundException } from '@nestjs/common';

/**
 * An exception that is thrown when a project task with the given id
 * was not found
 */
export class ProjectTaskNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Project Task with id ${id} not found`);
  }
}
