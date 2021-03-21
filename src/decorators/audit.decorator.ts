import {
  AuditAction,
  AuditResource,
} from './../modules/auditing/schemas/audit-log.schema';
import { AuditingInterceptor } from './../interceptors/auditing.interceptor';
import { applyDecorators, UseInterceptors, SetMetadata } from '@nestjs/common';

export const AUDIT_ACTION_KEY = 'audit_action';
export const AUDIT_RESOURCE_KEY = 'audit_resource';

export function Audit(auditAction: AuditAction, auditResource: AuditResource) {
  return applyDecorators(
    SetMetadata(AUDIT_ACTION_KEY, auditAction),
    SetMetadata(AUDIT_RESOURCE_KEY, auditResource),
    UseInterceptors(AuditingInterceptor),
  );
}
