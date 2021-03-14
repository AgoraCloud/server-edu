import { BadRequestException } from '@nestjs/common';

export class ExistingWorkspaceUserException extends BadRequestException {
  constructor(workspaceId: string, userId: string) {
    super(
      `User with id ${userId} is already a member in workspace with id ${workspaceId}`,
    );
  }
}
