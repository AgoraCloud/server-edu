import { BadRequestException } from '@nestjs/common';

/**
 * An exception that is thrown when a workspace will have no members
 * left if the given user was removed
 */
export class MinOneUserInWorkspaceException extends BadRequestException {
  constructor(workspaceId: string) {
    super(`Workspace with id ${workspaceId} will have no members left`);
  }
}
