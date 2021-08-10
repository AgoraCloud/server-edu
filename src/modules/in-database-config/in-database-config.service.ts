import {
  InDatabaseConfig,
  InDatabaseConfigDocument,
} from './schemas/in-database-configuration.schema';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class InDatabaseConfigService implements OnModuleInit {
  private inDatabaseConfig: InDatabaseConfigDocument;

  constructor(
    @InjectModel(InDatabaseConfig.name)
    private readonly inDatabaseConfigModel: Model<InDatabaseConfigDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    const inDatabaseConfigDocuments: InDatabaseConfigDocument[] =
      await this.inDatabaseConfigModel.find().exec();
    if (inDatabaseConfigDocuments.length) {
      // There is only one in database config document at any given time
      this.inDatabaseConfig = inDatabaseConfigDocuments[0];
    } else {
      // The in database config document hasn't been created yet, create it
      this.inDatabaseConfig = await this.inDatabaseConfigModel.create({});
    }
  }

  get instanceId(): string {
    return this.inDatabaseConfig.instanceId;
  }
}
