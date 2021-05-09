import { BadRequestException } from '@nestjs/common';

export class MinOneAdminUserInWorkspaceException extends BadRequestException {
  constructor(workspaceId: string) {
    super(`Workspace with id ${workspaceId} will have no admin members left`);
  }
}
