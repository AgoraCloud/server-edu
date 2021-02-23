import { NotFoundException } from '@nestjs/common';

export class ProjectTaskNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Project Task with id ${id} not found`);
  }
}
