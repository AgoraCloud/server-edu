import { ProjectLaneDocument } from './../modules/projects/lanes/schemas/lane.schema';
import { ProjectLanesService } from './../modules/projects/lanes/lanes.service';
import { ProjectDocument } from './../modules/projects/schemas/project.schema';
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
import { RequestWithWorkspaceUserProjectProjectLaneAndIsAdmin } from '../utils/requests.interface';

@Injectable()
export class ProjectLaneInterceptor implements NestInterceptor {
  constructor(private readonly projectLanesService: ProjectLanesService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request: RequestWithWorkspaceUserProjectProjectLaneAndIsAdmin = context
      .switchToHttp()
      .getRequest();
    const projectLaneId: string = request.params.laneId;
    if (!isMongoId(projectLaneId)) {
      throw new InvalidMongoIdException('projectLaneId');
    }

    const user: UserDocument = request.user;
    const workspace: WorkspaceDocument = request.workspace;
    const project: ProjectDocument = request.project;
    const isAdmin: boolean = request.isAdmin;
    const projectLane: ProjectLaneDocument = await this.projectLanesService.findOne(
      workspace._id,
      project._id,
      projectLaneId,
      isAdmin ? undefined : user._id,
    );
    request.projectLane = projectLane;
    return next.handle();
  }
}
