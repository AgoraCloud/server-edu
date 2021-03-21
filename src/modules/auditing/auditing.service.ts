import { InvalidMongoIdException } from './../../exceptions/invalid-mongo-id.exception';
import { isMongoId } from 'class-validator';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Query } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { removeDays } from '../../utils/date';

@Injectable()
export class AuditingService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  /**
   * Create an audit log
   * @param auditLog the audit log to create
   */
  async create(auditLog: AuditLog): Promise<AuditLogDocument> {
    return this.auditLogModel.create(auditLog);
  }

  /**
   * Find all audit logs
   * @param userId the users id
   * @param workspaceId the workspace id
   */
  async findAll(
    userId?: string,
    workspaceId?: string,
  ): Promise<AuditLogDocument[]> {
    let auditLogQuery: Query<
      AuditLogDocument[],
      AuditLogDocument
    > = this.auditLogModel
      .find()
      .populate('user')
      .populate('workspace')
      .sort({ createdAt: -1 });
    if (userId) {
      if (!isMongoId(userId)) throw new InvalidMongoIdException('userId');
      auditLogQuery = auditLogQuery.where('user').equals(userId);
    }
    if (workspaceId) {
      auditLogQuery = auditLogQuery.where('workspace').equals(workspaceId);
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
    const twentyEightDays: Date = removeDays(new Date(), 28);
    await this.auditLogModel
      .remove()
      .where('createdAt')
      .lte(twentyEightDays.getTime())
      .exec();
  }
}
