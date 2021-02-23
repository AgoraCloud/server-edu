import { ProjectLaneDocument } from './../modules/projects/lanes/schemas/lane.schema';
import { ProjectDocument } from './../modules/projects/schemas/project.schema';
import { WikiSectionDocument } from './../modules/wiki/sections/schemas/section.schema';
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

interface RequestWithWikiSection extends Request {
  wikiSection: WikiSectionDocument;
}

interface RequestWithProject extends Request {
  project: ProjectDocument;
}

interface RequestWithProjectLane extends Request {
  projectLane: ProjectLaneDocument;
}

interface RequestWithWorkspaceAndUser extends RequestWithUser {
  workspace: WorkspaceDocument;
}

interface RequestWithWorkspaceDeploymentAndUser
  extends RequestWithWorkspaceAndUser {
  deployment: DeploymentDocument;
}

interface RequestWithWorkspaceUserAndWikiSection
  extends RequestWithWorkspaceAndUser {
  wikiSection: WikiSectionDocument;
}

interface RequestWithWorkspaceUserAndProject
  extends RequestWithWorkspaceAndUser {
  project: ProjectDocument;
}

interface RequestWithWorkspaceUserProjectAndProjectLane
  extends RequestWithWorkspaceUserAndProject {
  projectLane: ProjectLaneDocument;
}

export {
  RequestWithUser,
  RequestWithWorkspace,
  RequestWithDeployment,
  RequestWithWikiSection,
  RequestWithProject,
  RequestWithProjectLane,
  RequestWithWorkspaceAndUser,
  RequestWithWorkspaceDeploymentAndUser,
  RequestWithWorkspaceUserAndWikiSection,
  RequestWithWorkspaceUserAndProject,
  RequestWithWorkspaceUserProjectAndProjectLane,
};
