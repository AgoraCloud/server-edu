import { NotFoundException } from '@nestjs/common';

/**
 * An exception that is thrown when a project lane with the given id
 * was not found
 */
export class ProjectLaneNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Project lane with id ${id} not found`);
  }
}
