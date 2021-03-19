import { Audit, AuditSchema } from './schemas/audit.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Module, Global } from '@nestjs/common';
import { AuditingService } from './auditing.service';
import { AuditingController } from './auditing.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Audit.name, schema: AuditSchema }]),
    WorkspacesModule,
  ],
  controllers: [AuditingController],
  providers: [AuditingService],
  exports: [AuditingService],
})
export class AuditingModule {}
