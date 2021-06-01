import { ProjectLaneDocument } from './../modules/projects/lanes/schemas/lane.schema';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithProjectLane } from '../utils/requests.interface';

/**
 * A method decorator that extracts a project lane or project lane property
 * from the request
 */
export const ProjectLane = createParamDecorator(
  (field: string, ctx: ExecutionContext) => {
    const request: RequestWithProjectLane = ctx.switchToHttp().getRequest();
    const projectLane: ProjectLaneDocument = request.projectLane;
    return field ? projectLane?.[field] : projectLane;
  },
);
