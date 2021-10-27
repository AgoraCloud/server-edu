import { NotFoundException } from '@nestjs/common';

/**
 * An exception that is thrown when a Kubernetes service with the given
 * cluster IP can not be found
 */
export class KubernetesServiceNotFoundException extends NotFoundException {
  constructor(clusterIP: string) {
    super(`Kubernetes service with cluster IP ${clusterIP} can not be found`);
  }
}
