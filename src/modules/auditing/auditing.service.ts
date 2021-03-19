import { InvalidMongoIdException } from './../../exceptions/invalid-mongo-id.exception';
import { isMongoId } from 'class-validator';
import { Audit, AuditDocument } from './schemas/audit.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Query } from 'mongoose';

@Injectable()
export class AuditingService {
  constructor(
    @InjectModel(Audit.name) private readonly auditModel: Model<AuditDocument>,
  ) {}

  // TODO: add comments
  async create(auditEntry: Audit): Promise<void> {
    await this.auditModel.create(auditEntry);
  }

  // TODO: add comments
  async findAll(
    userId?: string,
    workspaceId?: string,
  ): Promise<AuditDocument[]> {
    let auditQuery: Query<
      AuditDocument[],
      AuditDocument
    > = this.auditModel.find().populate('user').populate('workspace');
    if (userId) {
      if (!isMongoId(userId)) throw new InvalidMongoIdException('userId');
      auditQuery = auditQuery.where('user').equals(userId);
    }
    if (workspaceId) {
      auditQuery = auditQuery.where('workspace').equals(workspaceId);
    }
    const auditEntries: AuditDocument[] = await auditQuery.exec();
    return auditEntries;
  }
}
