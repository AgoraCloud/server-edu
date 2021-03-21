import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Module, Global } from '@nestjs/common';
import { AuditingService } from './auditing.service';
import { AuditingController } from './auditing.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    WorkspacesModule,
  ],
  controllers: [AuditingController],
  providers: [AuditingService],
  exports: [AuditingService],
})
export class AuditingModule {}
