import { BadRequestException } from '@nestjs/common';

/**
 * An exception that is thrown when a workspace admin is adding a user
 * that is already a member of the given workspace
 */
export class ExistingWorkspaceUserException extends BadRequestException {
  constructor(workspaceId: string, userEmail: string) {
    super(
      `User with email ${userEmail} is already a member in workspace with id ${workspaceId}`,
    );
  }
}
