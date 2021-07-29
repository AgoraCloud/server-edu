import { ProxyService } from './../../proxy/proxy.service';
import { RequestWithDeploymentAndUser } from '../../../utils/requests.interface';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class ProxyAuthorizationGuard implements CanActivate {
  constructor(private readonly proxyService: ProxyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: RequestWithDeploymentAndUser = context
      .switchToHttp()
      .getRequest();
    return this.proxyService.authorize(request);
  }
}
