import {
  InDatabaseConfig,
  InDatabaseConfigSchema,
} from './schemas/in-database-configuration.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { InDatabaseConfigService } from './in-database-config.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InDatabaseConfig.name, schema: InDatabaseConfigSchema },
    ]),
  ],
  providers: [InDatabaseConfigService],
  exports: [InDatabaseConfigService],
})
export class InDatabaseConfigModule {}
