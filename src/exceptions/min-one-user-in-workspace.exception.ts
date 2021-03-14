import { BadRequestException } from '@nestjs/common';

export class MinOneUserInWorkspaceException extends BadRequestException {
  constructor(workspaceId: string) {
    super(`Workspace with id ${workspaceId} will have no members left`);
  }
}
