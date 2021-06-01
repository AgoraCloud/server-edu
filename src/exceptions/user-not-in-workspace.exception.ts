import { BadRequestException } from '@nestjs/common';

/**
 * An exception that is thrown when the user with the given id is not
 * a member of the workspace with the given id
 */
export class UserNotInWorkspaceException extends BadRequestException {
  constructor(userId: string, workspaceId: string) {
    super(
      `User with id ${userId} is not a member of workspace with id ${workspaceId}`,
    );
  }
}
