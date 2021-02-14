import { NotFoundException } from '@nestjs/common';

export class ProjectNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Project with id ${id} not found`);
  }
}
