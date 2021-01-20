import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

export const MongooseMockModule = (options: MongooseModuleOptions = {}) =>
  MongooseModule.forRootAsync({
    useFactory: async () => {
      mongod = new MongoMemoryServer();
      const uri: string = await mongod.getUri();
      return {
        uri,
        ...options,
      };
    },
  });

export const closeMongooseConnection = async (): Promise<void> => {
  if (mongod) await mongod.stop();
};
