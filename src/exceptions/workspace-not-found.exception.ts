import { NotFoundException } from '@nestjs/common';

export class WorkspaceNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Workspace with id ${id} not found`);
  }
}
