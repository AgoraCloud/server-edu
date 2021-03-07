import { BadRequestException } from '@nestjs/common';

export class UserNotInWorkspaceException extends BadRequestException {
  constructor(userId: string, workspaceId: string) {
    super(
      `User with id ${userId} is not a member of workspace with id ${workspaceId}`,
    );
  }
}
