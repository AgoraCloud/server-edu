import { ProxyService } from './proxy.service';
import { DeploymentInterceptor } from './../../interceptors/deployment.interceptor';
import { JwtAuthenticationGuard } from '../authentication/guards/jwt-authentication.guard';
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

@Controller('proxy/:deploymentId')
@UseGuards(JwtAuthenticationGuard)
@UseInterceptors(DeploymentInterceptor)
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All()
  proxy(
    @Param('deploymentId') deploymentId: string,
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ): void {
    this.proxyService.proxy(deploymentId, req, res, next);
  }
}
