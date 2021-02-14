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
import { RequestWithWorkspaceUserAndProject } from '../utils/requests.interface';

@Injectable()
export class ProjectInterceptor implements NestInterceptor {
  constructor(private readonly projectsService: ProjectsService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request: RequestWithWorkspaceUserAndProject = context
      .switchToHttp()
      .getRequest();
    const projectId: string = request.params.projectId;
    if (!isMongoId(projectId)) {
      throw new InvalidMongoIdException('projectId');
    }

    const user: UserDocument = request.user;
    const workspace: WorkspaceDocument = request.workspace;
    const project: ProjectDocument = await this.projectsService.findOne(
      user._id,
      workspace._id,
      projectId,
    );
    request.project = project;
    return next.handle();
  }
}
