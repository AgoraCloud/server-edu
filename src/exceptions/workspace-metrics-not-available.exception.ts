import { BadRequestException } from '@nestjs/common';

/**
 * An exception that is thrown when metrics for a workspace are not available
 */
export class WorkspaceMetricsNotAvailableException extends BadRequestException {
  constructor(workspaceId: string) {
    super(`Metrics for workspace with id ${workspaceId} not available`);
  }
}
