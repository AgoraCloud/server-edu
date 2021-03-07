import { UserNotInWorkspaceException } from './../exceptions/user-not-in-workspace.exception';
import { InvalidMongoIdException } from './../exceptions/invalid-mongo-id.exception';
import { RequestWithWorkspaceUserAndIsAdmin } from '../utils/requests.interface';
import { WorkspaceDocument } from './../modules/workspaces/schemas/workspace.schema';
import { UserDocument } from '../modules/users/schemas/user.schema';
import { WorkspacesService } from './../modules/workspaces/workspaces.service';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { isMongoId } from 'class-validator';

@Injectable()
export class WorkspaceInterceptor implements NestInterceptor {
  constructor(private readonly workspaceService: WorkspacesService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request: RequestWithWorkspaceUserAndIsAdmin = context
      .switchToHttp()
      .getRequest();
    const workspaceId: string = request.params.workspaceId;
    if (!isMongoId(workspaceId)) {
      throw new InvalidMongoIdException('workspaceId');
    }

    const user: UserDocument = request.user;
    const isAdmin: boolean = request.isAdmin;
    const workspace: WorkspaceDocument = await this.workspaceService.findOne(
      workspaceId,
      isAdmin ? undefined : user._id,
    );

    // A super admin or workspace admin is updating a user in the workspace,
    // check if the user exists in the workspace
    const userId: string = request.params.userId;
    if (userId && workspace.users.findIndex((u) => u._id == userId) === -1) {
      throw new UserNotInWorkspaceException(userId, workspaceId);
    }
    request.workspace = workspace;
    return next.handle();
  }
}
