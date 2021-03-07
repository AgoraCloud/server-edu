import { ProjectDocument } from './../modules/projects/schemas/project.schema';
import { ProjectsService } from './../modules/projects/projects.service';
import { Observable } from 'rxjs';
import { WorkspaceDocument } from './../modules/workspaces/schemas/workspace.schema';
import { UserDocument } from './../modules/users/schemas/user.schema';
import { InvalidMongoIdException } from './../exceptions/invalid-mongo-id.exception';
import { isMongoId } from 'class-validator';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { RequestWithWorkspaceUserProjectAndIsAdmin } from '../utils/requests.interface';

@Injectable()
export class ProjectInterceptor implements NestInterceptor {
  constructor(private readonly projectsService: ProjectsService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request: RequestWithWorkspaceUserProjectAndIsAdmin = context
      .switchToHttp()
      .getRequest();
    const projectId: string = request.params.projectId;
    if (!isMongoId(projectId)) {
      throw new InvalidMongoIdException('projectId');
    }

    const user: UserDocument = request.user;
    const workspace: WorkspaceDocument = request.workspace;
    const isAdmin: boolean = request.isAdmin;
    const project: ProjectDocument = await this.projectsService.findOne(
      workspace._id,
      projectId,
      isAdmin ? undefined : user._id,
    );
    request.project = project;
    return next.handle();
  }
}
