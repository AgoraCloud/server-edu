import { DeploymentInterceptor } from './../../interceptors/deployment.interceptor';
import { JwtAuthenticationGuard } from 'src/modules/authentication/guards/jwt-authentication.guard';
import {
  All,
  Controller,
  Param,
  Req,
  Res,
  UseGuards,
  Next,
  UseInterceptors,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as httpProxy from 'http-proxy';

@Controller('proxy/:deploymentId')
@UseGuards(JwtAuthenticationGuard)
@UseInterceptors(DeploymentInterceptor)
export class ProxyController {
  private readonly httpProxy: httpProxy = new httpProxy();
  private readonly resourcePrefix: string = 'agoracloud';

  @All()
  async proxy(
    @Param('deploymentId') deploymentId: string,
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ): Promise<void> {
    const options: httpProxy.ServerOptions = {
      changeOrigin: true,
      target: `http://${this.resourcePrefix}-${deploymentId}`,
    };
    const connection: string = req.headers['connection'];
    const upgrade: string = req.headers['upgrade'];
    if (connection === 'Upgrade' && upgrade === 'websocket') {
      this.httpProxy.ws(req, req.socket, req.app.head, options);
    } else {
      this.httpProxy.web(req, res, options, next);
    }
  }
}
