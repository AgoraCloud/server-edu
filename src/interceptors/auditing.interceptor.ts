import {
  AUDIT_ACTION_KEY,
  AUDIT_RESOURCE_KEY,
} from './../decorators/audit.decorator';
import { AuditAction } from './../modules/auditing/schemas/audit-log.schema';
import { AuditLog } from '../modules/auditing/schemas/audit-log.schema';
import { AuditingService } from './../modules/auditing/auditing.service';
import { Reflector } from '@nestjs/core';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { RequestWithWorkspaceUserAndIsAdmin } from '../utils/requests.interface';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditingInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditingService: AuditingService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditAction: AuditAction = this.reflector.get<AuditAction>(
      AUDIT_ACTION_KEY,
      context.getHandler(),
    );
    const auditResource: string = this.reflector
      .get<string>(AUDIT_RESOURCE_KEY, context.getHandler())
      .toUpperCase();
    const request: RequestWithWorkspaceUserAndIsAdmin = context
      .switchToHttp()
      .getRequest();
    const response: Response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      tap(async () => {
        const auditLog: AuditLog = new AuditLog({
          isSuccessful:
            response.statusCode >= 200 && response.statusCode <= 299,
          action: auditAction,
          resource: auditResource,
          userAgent: request.get('user-agent') || '',
          ip: request.ip,
          user: request.user,
          workspace: request.workspace,
        });
        await this.auditingService.create(auditLog);
      }),
    );
  }
}
