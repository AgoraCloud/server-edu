import { ExceptionDto } from './../../utils/base.dto';
import {
  ApiTags,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
} from '@nestjs/swagger';
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
import { Deployment } from '../../decorators/deployment.decorator';

@ApiCookieAuth()
@ApiTags('Proxy')
@Controller('proxy/:deploymentId')
@UseGuards(JwtAuthenticationGuard)
@UseInterceptors(DeploymentInterceptor)
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Proxy a deployment API request
   * @param deployment the deployment
   * @param req the request
   * @param res the response
   */
  @All()
  @ApiOperation({ summary: 'Proxy a deployment API request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiInternalServerErrorResponse({
    description: 'An error occurred when the api request was being proxied',
    type: ExceptionDto,
  })
  proxy(
    @Deployment() deployment: DeploymentDocument,
    @Req() req: Request,
    @Res() res: Response,
  ): void {
    this.proxyService.proxy(deployment, req, res);
  }
}
