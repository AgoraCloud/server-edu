import { WorkspaceDocument } from './../modules/workspaces/schemas/workspace.schema';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithWorkspace } from '../utils/requests.interface';

export const Workspace = createParamDecorator(
  (field: string, ctx: ExecutionContext) => {
    const request: RequestWithWorkspace = ctx.switchToHttp().getRequest();
    const workspace: WorkspaceDocument = request.workspace;
    return field ? workspace?.[field] : workspace;
  },
);
