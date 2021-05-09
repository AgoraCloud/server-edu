import { NotFoundException } from '@nestjs/common';

/**
 * An exception that is thrown when a workspace with the given id
 * was not found
 */
export class WorkspaceNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Workspace with id ${id} not found`);
  }
}
