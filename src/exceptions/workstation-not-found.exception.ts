import { NotFoundException } from '@nestjs/common';

/**
 * An exception that is thrown when a workstation with the given id
 * was not found
 */
export class WorkstationNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Workstation with id ${id} not found`);
  }
}
