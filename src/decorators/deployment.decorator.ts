import { DeploymentDocument } from './../modules/deployments/schemas/deployment.schema';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithDeployment } from '../utils/requests.interface';

export const Deployment = createParamDecorator(
  (field: string, ctx: ExecutionContext) => {
    const request: RequestWithDeployment = ctx.switchToHttp().getRequest();
    const deployment: DeploymentDocument = request.deployment;
    return field ? deployment?.[field] : deployment;
  },
);
