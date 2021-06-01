import { NotFoundException } from '@nestjs/common';

/**
 * An exception that is thrown when the deployment with the given id
 * was not found
 */
export class DeploymentNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Deployment with id ${id} not found`);
  }
}
