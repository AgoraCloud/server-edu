import { Auth } from '../../decorators/auth.decorator';
import { ExceptionDto } from './../../utils/base.dto';
import {
  ApiTags,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { DeploymentDocument } from './../deployments/schemas/deployment.schema';
import { ProxyService } from './proxy.service';
import { All, Controller, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { Deployment } from '../../decorators/deployment.decorator';
import { ProxyAuthorizationGuard } from '../authorization/guards/proxy-authorization.guard';

@ApiCookieAuth()
@ApiTags('Proxy')
@Auth()
@Controller('proxy/:deploymentId')
@UseGuards(ProxyAuthorizationGuard)
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
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
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
