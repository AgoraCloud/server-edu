import { DeploymentDocument } from './../deployments/schemas/deployment.schema';
import { ProxyService } from './proxy.service';
import { DeploymentInterceptor } from './../../interceptors/deployment.interceptor';
import { JwtAuthenticationGuard } from '../authentication/guards/jwt-authentication.guard';
import {
  All,
  Controller,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Deployment } from 'src/decorators/deployment.decorator';

@Controller('proxy/:deploymentId')
@UseGuards(JwtAuthenticationGuard)
@UseInterceptors(DeploymentInterceptor)
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All()
  proxy(
    @Deployment() deployment: DeploymentDocument,
    @Req() req: Request,
    @Res() res: Response,
  ): void {
    this.proxyService.proxy(deployment, req, res);
  }
}
