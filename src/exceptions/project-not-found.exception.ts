import { NotFoundException } from '@nestjs/common';

/**
 * An exception that is thrown when a project with the given id
 * was not found
 */
export class ProjectNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Project with id ${id} not found`);
  }
}
