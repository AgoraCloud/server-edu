import {
  AuditAction,
  AuditResource,
} from './../modules/auditing/schemas/audit-log.schema';
import { AuditingInterceptor } from './../interceptors/auditing.interceptor';
import { applyDecorators, UseInterceptors, SetMetadata } from '@nestjs/common';

/**
 * The audit action metadata key, used to extract the audit action from a method
 */
export const AUDIT_ACTION_KEY = 'audit_action';
/**
 * The audit resource metadata key, used to extract the audit resource from a method
 */
export const AUDIT_RESOURCE_KEY = 'audit_resource';

/**
 * A decorator that applies the audit action metadata, audit resource metadata and audit
 * interceptor to a method
 * @param auditAction the audit action
 * @param auditResource the audit resource
 * @returns a fully configured audit decorator
 */
export function Audit(auditAction: AuditAction, auditResource: AuditResource) {
  return applyDecorators(
    SetMetadata(AUDIT_ACTION_KEY, auditAction),
    SetMetadata(AUDIT_RESOURCE_KEY, auditResource),
    UseInterceptors(AuditingInterceptor),
  );
}
