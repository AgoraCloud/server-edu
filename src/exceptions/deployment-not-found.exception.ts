import { NotFoundException } from '@nestjs/common';

export class DeploymentNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Deployment with id ${id} not found`);
  }
}
