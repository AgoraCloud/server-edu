import { DeploymentNotRunningException } from './../exceptions/deployment-not-running.exception';
import { DeploymentDocument } from './../modules/deployments/schemas/deployment.schema';
import { InvalidMongoIdException } from './../exceptions/invalid-mongo-id.exception';
import { WorkspaceDocument } from './../modules/workspaces/schemas/workspace.schema';
import { UserDocument } from './../modules/users/schemas/user.schema';
import { isMongoId } from 'class-validator';
import { RequestWithWorkspaceDeploymentUserAndIsAdmin } from './../utils/requests.interface';
import { DeploymentsService } from './../modules/deployments/deployments.service';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { DeploymentStatusDto } from '@agoracloud/common';

/**
 * An interceptor that extracts the deployment id from the request, fetches it from
 * the database and attaches it to the request
 */
@Injectable()
export class DeploymentInterceptor implements NestInterceptor {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request: RequestWithWorkspaceDeploymentUserAndIsAdmin = context
      .switchToHttp()
      .getRequest();
    const deploymentId: string = request.params.deploymentId;
    if (!isMongoId(deploymentId)) {
      throw new InvalidMongoIdException('deploymentId');
    }

    const user: UserDocument = request.user;
    const workspace: WorkspaceDocument = request.workspace;
    const isAdmin = request.isAdmin;
    const deployment: DeploymentDocument =
      await this.deploymentsService.findOne(
        deploymentId,
        isAdmin ? undefined : user._id,
        workspace._id,
      );

    // Don't throw an exception if the deployment is not running when the user
    // is invoking the turn deployment on or off routes
    const isDeploymentTurnOnOrOffRoute: boolean =
      request.path.includes('/on') || request.path.includes('/off');
    if (
      !isDeploymentTurnOnOrOffRoute &&
      deployment.status !== DeploymentStatusDto.Running
    ) {
      throw new DeploymentNotRunningException(deploymentId);
    }
    request.deployment = deployment;
    return next.handle();
  }
}
