import { ProjectDocument } from './../modules/projects/schemas/project.schema';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithProject } from '../utils/requests.interface';

/**
 * A method decorator that extracts a project or project property from
 * the request
 */
export const Project = createParamDecorator(
  (field: string, ctx: ExecutionContext) => {
    const request: RequestWithProject = ctx.switchToHttp().getRequest();
    const project: ProjectDocument = request.project;
    return field ? project?.[field] : project;
  },
);
