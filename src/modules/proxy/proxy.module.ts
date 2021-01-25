import { DeploymentsModule } from './../deployments/deployments.module';
import { Module } from '@nestjs/common';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import * as HttpProxy from 'http-proxy';

@Module({
  imports: [DeploymentsModule],
  providers: [ProxyService, { provide: HttpProxy, useValue: new HttpProxy() }],
  controllers: [ProxyController],
})
export class ProxyModule {}
