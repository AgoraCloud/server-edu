import { BadRequestException } from '@nestjs/common';

/**
 * An exception that is thrown when a user has no provisioned workstation
 */
export class NoProvisionedWorkstationException extends BadRequestException {
  constructor(userId: string) {
    super(`User with id ${userId} has no provisioned workstation`);
  }
}
