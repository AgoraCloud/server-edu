import { BadRequestException } from '@nestjs/common';

export class WorkspaceMetricsNotAvailableException extends BadRequestException {
  constructor(workspaceId: string) {
    super(`Metrics for workspace with id ${workspaceId} not available`);
  }
}
