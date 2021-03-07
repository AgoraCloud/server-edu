import { WorkspacesModule } from './../workspaces/workspaces.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Module, Global } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { AuthorizationController } from './authorization.controller';
import { Permission, PermissionSchema } from './schemas/permission.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Permission.name, schema: PermissionSchema },
    ]),
    WorkspacesModule,
  ],
  controllers: [AuthorizationController],
  providers: [AuthorizationService],
  exports: [AuthorizationService],
})
export class AuthorizationModule {}
