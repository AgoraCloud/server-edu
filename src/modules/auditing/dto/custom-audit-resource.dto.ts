import { AuditResourceDto } from '@agoracloud/common';

export enum CustomAuditResourceDto {
  Workstation = 'WORKSTATION',
}

export type AuditResource = AuditResourceDto | CustomAuditResourceDto;
