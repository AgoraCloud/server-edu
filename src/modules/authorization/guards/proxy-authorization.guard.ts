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
import { Action } from '../schemas/permission.schema';
import { UserDocument } from '../../users/schemas/user.schema';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class ProxyAuthorizationGuard implements CanActivate {
  private readonly proxyPermissions: Action[] = [
    Action.ReadWorkspace,
    Action.ReadDeployment,
    Action.ProxyDeployment,
  ];

  constructor(
    private readonly deploymentsService: DeploymentsService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    const { canActivate } = await this.authorizationService.can(
      user,
      this.proxyPermissions,
      deployment.workspace._id,
    );
    if (canActivate) {
      if (deployment.status !== DeploymentStatus.Running) {
        throw new DeploymentNotRunningException(deploymentId);
      }
      request.deployment = deployment;
    }
    return canActivate;
  }
}
