import {
  AUDIT_ACTION_KEY,
  AUDIT_RESOURCE_KEY,
} from './../decorators/audit.decorator';
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
import { Observable, throwError } from 'rxjs';
import { RequestWithWorkspaceUserAndIsAdmin } from '../utils/requests.interface';
import { catchError, tap } from 'rxjs/operators';
import { AuditActionDto, AuditResourceDto } from '@agoracloud/common';

/**
 * An interceptor that records every action performed by every user
 */
@Injectable()
export class AuditingInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditingService: AuditingService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditAction: AuditActionDto = this.reflector.get<AuditActionDto>(
      AUDIT_ACTION_KEY,
      context.getHandler(),
    );
    const auditResource: AuditResourceDto =
      this.reflector.get<AuditResourceDto>(
        AUDIT_RESOURCE_KEY,
        context.getHandler(),
      );
    const request: RequestWithWorkspaceUserAndIsAdmin = context
      .switchToHttp()
      .getRequest();
    const response: Response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      tap(() => {
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
        this.auditingService.create(auditLog);
      }),
      catchError((err: any) => {
        let failureReason: any = err.response?.message;
        if (Array.isArray(failureReason)) {
          failureReason = failureReason.toString();
        }
        const auditLog: AuditLog = new AuditLog({
          isSuccessful: false,
          failureReason,
          action: auditAction,
          resource: auditResource,
          userAgent: request.get('user-agent') || '',
          ip: request.ip,
          user: request.user,
          workspace: request.workspace,
        });
        this.auditingService.create(auditLog);
        return throwError(err);
      }),
    );
  }
}
