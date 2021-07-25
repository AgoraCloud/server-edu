import {
  ActionDto,
  AuditActionDto,
  AuditResourceDto,
  ExceptionDto,
} from '@agoracloud/common';
import { JwtAuthenticationGuard } from './../authentication/guards/jwt-authentication.guard';
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
import { Permissions } from '../../decorators/permissions.decorator';
import { Audit } from '../../decorators/audit.decorator';

@ApiCookieAuth()
@ApiTags('Proxy')
@Controller({ host: 'p:deploymentId' })
@UseGuards(JwtAuthenticationGuard, ProxyAuthorizationGuard)
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Proxy a deployment API request
   * @param deployment the deployment
   * @param req the request
   * @param res the response
   */
  @All()
  @Permissions(
    ActionDto.ReadWorkspace,
    ActionDto.ReadDeployment,
    ActionDto.ProxyDeployment,
  )
  @Audit(AuditActionDto.Proxy, AuditResourceDto.Deployment)
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
