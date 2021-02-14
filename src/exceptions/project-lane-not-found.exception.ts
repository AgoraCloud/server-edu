import { NotFoundException } from '@nestjs/common';

export class ProjectLaneNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Project lane with id ${id} not found`);
  }
}
