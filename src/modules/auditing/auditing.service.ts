import { DateUtil } from './../../utils/date.util';
import { AuditLogQueryParamsDto } from './dto/audit-log-query-params.dto';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Query } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AuditingService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  /**
   * Create an audit log
   * @param auditLog the audit log to create
   * @returns the created audit log document
   */
  async create(auditLog: AuditLog): Promise<AuditLogDocument> {
    return this.auditLogModel.create(auditLog);
  }

  /**
   * Find all audit logs
   * @param auditLogQueryParamsDto the audit logs query params
   * @returns an array of audit log documents
   */
  async findAll(
    auditLogQueryParamsDto: AuditLogQueryParamsDto,
  ): Promise<AuditLogDocument[]> {
    let auditLogQuery: Query<AuditLogDocument[], AuditLogDocument> =
      this.auditLogModel
        .find()
        .populate('user')
        .populate('workspace')
        .sort({ createdAt: -1 });
    if (auditLogQueryParamsDto.isSuccessful) {
      auditLogQuery = auditLogQuery
        .where('isSuccessful')
        .equals(JSON.parse(auditLogQueryParamsDto.isSuccessful));
    }
    if (auditLogQueryParamsDto.action) {
      auditLogQuery = auditLogQuery
        .where('action')
        .equals(auditLogQueryParamsDto.action);
    }
    if (auditLogQueryParamsDto.resource) {
      auditLogQuery = auditLogQuery
        .where('resource')
        .equals(auditLogQueryParamsDto.resource);
    }
    if (auditLogQueryParamsDto.userAgent) {
      auditLogQuery = auditLogQuery
        .where('userAgent')
        .equals(auditLogQueryParamsDto.userAgent);
    }
    if (auditLogQueryParamsDto.ip) {
      auditLogQuery = auditLogQuery
        .where('ip')
        .equals(auditLogQueryParamsDto.ip);
    }
    if (auditLogQueryParamsDto.userId) {
      auditLogQuery = auditLogQuery
        .where('user')
        .equals(auditLogQueryParamsDto.userId);
    }
    if (auditLogQueryParamsDto.workspaceId) {
      auditLogQuery = auditLogQuery
        .where('workspace')
        .equals(auditLogQueryParamsDto.workspaceId);
    }
    if (auditLogQueryParamsDto.take) {
      auditLogQuery = auditLogQuery.limit(+auditLogQueryParamsDto.take);
    }
    if (auditLogQueryParamsDto.skip) {
      auditLogQuery = auditLogQuery.skip(+auditLogQueryParamsDto.skip);
    }
    const auditLogs: AuditLogDocument[] = await auditLogQuery.exec();
    return auditLogs;
  }

  /**
   * Cron job that runs every hour and deletes audit logs that have been
   * created 28 days ago or greater
   */
  @Cron(CronExpression.EVERY_HOUR)
  private async deleteExpiredAuditLogsJob(): Promise<void> {
    const twentyEightDays: Date = DateUtil.removeDays(new Date(), 28);
    await this.auditLogModel
      .deleteMany()
      .where('createdAt')
      .lte(twentyEightDays.getTime())
      .exec();
  }
}
