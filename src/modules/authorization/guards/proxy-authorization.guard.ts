import { DeploymentNotFoundException } from './../../../exceptions/deployment-not-found.exception';
import { PERMISSIONS_KEY } from './../../../decorators/permissions.decorator';
import { Reflector } from '@nestjs/core';
import { Action } from './../schemas/permission.schema';
import { RequestWithDeploymentAndUser } from '../../../utils/requests.interface';
import { DeploymentNotRunningException } from './../../../exceptions/deployment-not-running.exception';
import { DeploymentsService } from './../../deployments/deployments.service';
import { InvalidMongoIdException } from './../../../exceptions/invalid-mongo-id.exception';
import { isMongoId } from 'class-validator';
import {
  DeploymentDocument,
  DeploymentStatus,
} from './../../deployments/schemas/deployment.schema';
import { AuthorizationService } from '../authorization.service';
import { UserDocument } from '../../users/schemas/user.schema';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class ProxyAuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly deploymentsService: DeploymentsService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions: Action[] =
      this.reflector.get<Action[]>(PERMISSIONS_KEY, context.getHandler()) || [];
    const request: RequestWithDeploymentAndUser = context
      .switchToHttp()
      .getRequest();
    const deploymentId: string = request.params.deploymentId;
    if (!isMongoId(deploymentId)) {
      throw new InvalidMongoIdException('deploymentId');
    }

    const deployment: DeploymentDocument = await this.deploymentsService.findOne(
      deploymentId,
    );
    const user: UserDocument = request.user;

    const { canActivate, isAdmin } = await this.authorizationService.can(
      user,
      permissions,
      deployment.workspace._id,
    );
    if (canActivate) {
      if (!isAdmin && deployment.user._id.toString() != user._id.toString()) {
        throw new DeploymentNotFoundException(deploymentId);
      }
      if (deployment.status !== DeploymentStatus.Running) {
        throw new DeploymentNotRunningException(deploymentId);
      }
      request.deployment = deployment;
    }
    return canActivate;
  }
}
