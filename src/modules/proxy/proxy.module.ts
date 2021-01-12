import { DeploymentsModule } from './../deployments/deployments.module';
import { Module } from '@nestjs/common';
import { ProxyController } from './proxy.controller';

@Module({
  imports: [DeploymentsModule],
  controllers: [ProxyController],
})
export class ProxyModule {}
