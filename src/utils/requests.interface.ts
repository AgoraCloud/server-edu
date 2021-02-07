import { DeploymentDocument } from './../modules/deployments/schemas/deployment.schema';
import { WorkspaceDocument } from './../modules/workspaces/schemas/workspace.schema';
import { UserDocument } from '../modules/users/schemas/user.schema';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: UserDocument;
}

interface RequestWithWorkspace extends Request {
  workspace: WorkspaceDocument;
}

interface RequestWithDeployment extends Request {
  deployment: DeploymentDocument;
}

interface RequestWithWorkspaceAndUser extends RequestWithUser {
  workspace: WorkspaceDocument;
}

interface RequestWithWorkspaceDeploymentAndUser
  extends RequestWithWorkspaceAndUser {
  deployment: DeploymentDocument;
}

export {
  RequestWithUser,
  RequestWithWorkspace,
  RequestWithDeployment,
  RequestWithWorkspaceAndUser,
  RequestWithWorkspaceDeploymentAndUser,
};
