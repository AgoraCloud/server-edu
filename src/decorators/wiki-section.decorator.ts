import { WikiSectionDocument } from '../modules/wiki/sections/schemas/section.schema';
import { RequestWithWikiSection } from '../utils/requests.interface';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * A method decorator that extracts a wiki section or wiki section property
 * from the request
 */
export const WikiSection = createParamDecorator(
  (field: string, ctx: ExecutionContext) => {
    const request: RequestWithWikiSection = ctx.switchToHttp().getRequest();
    const wikiSection: WikiSectionDocument = request.wikiSection;
    return field ? wikiSection?.[field] : wikiSection;
  },
);
