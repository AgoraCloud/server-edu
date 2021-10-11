import { PROXY_ACTIONS_DTO } from './../authorization/schemas/permission.schema';
import { AuthorizationService } from './../authorization/authorization.service';
import { DeploymentNotRunningException } from './../../exceptions/deployment-not-running.exception';
import { DeploymentNotFoundException } from './../../exceptions/deployment-not-found.exception';
import { DeploymentStatusDto } from '@agoracloud/common';
import { AuthenticationService } from './../authentication/authentication.service';
import { UserDocument } from './../users/schemas/user.schema';
import { KubeUtil } from './../kubernetes/utils/kube.util';
import { ProxyUtil } from './utils/proxy.util';
import { DeploymentsService } from './../deployments/deployments.service';
import { InvalidMongoIdException } from './../../exceptions/invalid-mongo-id.exception';
import { isMongoId } from 'class-validator';
import { DeploymentDocument } from './../deployments/schemas/deployment.schema';
import { HttpAdapterHost } from '@nestjs/core';
import { Request, Response } from 'express';
import {
  Inject,
  Injectable,
  OnModuleInit,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import * as HttpProxy from 'http-proxy';
import { Server } from 'http';
import { Socket } from 'net';
import * as Cookie from 'cookie';
import {
  RequestWithDeploymentAndUser,
  RequestWithUser,
} from '../../utils/requests.interface';
import { ConfigService } from '@nestjs/config';
import { Config } from '../../config/configuration.interface';

@Injectable()
export class ProxyService implements OnModuleInit {
  private readonly domain: string;
  private readonly logger: Logger = new Logger(ProxyService.name);

  constructor(
    @Inject(HttpProxy) private readonly httpProxy: HttpProxy,
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly deploymentsService: DeploymentsService,
    private readonly authenticationService: AuthenticationService,
    private readonly authorizationService: AuthorizationService,
    private readonly configService: ConfigService<Config>,
  ) {
    this.domain = this.configService.get<string>('domain');
  }

  onModuleInit(): void {
    this.onProxyError();
    this.proxyWebsockets();
  }

  /**
   * Handle proxy errors
   */
  private onProxyError(): void {
    this.httpProxy.on('error', (err: Error) => {
      this.logger.error({
        message: 'Proxy error',
        error: err,
      });
    });
  }

  /**
   * Proxy all deployment websockets
   * @throws InvalidMongoIdException
   */
  private proxyWebsockets(): void {
    const httpServer: Server = this.httpAdapterHost.httpAdapter.getHttpServer();
    httpServer.on(
      'upgrade',
      async (req: RequestWithDeploymentAndUser, socket: Socket, head: any) => {
        try {
          await this.authenticateWebsocket(req);
          await this.authorizeWebsocket(req);
          const deployment: DeploymentDocument = req.deployment;
          this.httpProxy.ws(
            req,
            socket,
            head,
            this.makeProxyOptions(deployment.workspace._id, deployment._id),
          );
        } catch (err) {
          this.logger.error({
            message: 'Error proxying websocket',
            error: err,
          });
          socket.destroy();
        }
      },
    );
  }

  /**
   * Proxy all deployment requests
   * @param deployment the deployment
   * @param req the request
   * @param res the response
   */
  proxy(deployment: DeploymentDocument, req: Request, res: Response): void {
    this.httpProxy.web(
      req,
      res,
      this.makeProxyOptions(deployment.workspace._id, deployment._id),
    );
  }

  /**
   * Checks if the user is authorized to proxy deployments
   * @param req the server request instance
   * @returns boolean indicating whether the user is authorized to proxy deployments or not
   */
  async authorize(req: RequestWithDeploymentAndUser): Promise<boolean> {
    const hostname: string = req.hostname || req.headers.host;
    const deploymentId: string =
      ProxyUtil.getDeploymentIdFromHostname(hostname);
    if (!isMongoId(deploymentId)) {
      throw new InvalidMongoIdException('deploymentId');
    }

    const deployment: DeploymentDocument =
      await this.deploymentsService.findOne(deploymentId);
    const user: UserDocument = req.user;

    const { canActivate, isAdmin } = await this.authorizationService.can(
      user,
      PROXY_ACTIONS_DTO,
      deployment.workspace._id,
    );
    if (canActivate) {
      if (!isAdmin && deployment.user._id.toString() != user._id.toString()) {
        throw new DeploymentNotFoundException(deploymentId);
      }
      if (deployment.status !== DeploymentStatusDto.Running) {
        throw new DeploymentNotRunningException(deploymentId);
      }
      req.deployment = deployment;
    }
    return canActivate;
  }

  /**
   * Dynamically creates configuration options for the proxy
   * @param workspaceId the deployments workspace id
   * @param deploymentId the deployment id
   * @returns the http-proxy server options
   */
  private makeProxyOptions(
    workspaceId: string,
    deploymentId: string,
  ): HttpProxy.ServerOptions {
    return {
      target: `http://${KubeUtil.generateResourceName(
        deploymentId,
      )}.${KubeUtil.generateResourceName(workspaceId)}.svc.cluster.local`,
      cookieDomainRewrite: {
        '*': ProxyUtil.generatePublicProxyUrl(this.domain, deploymentId),
      },
    };
  }

  /**
   * Makes sure a user is authenticated before proxying websockets
   * @param req the server request instance
   */
  private async authenticateWebsocket(req: RequestWithUser): Promise<void> {
    // Check if the request headers contains cookies
    const headerCookies: string = req.headers.cookie;
    if (!headerCookies) throw new UnauthorizedException();
    // Parse the cookies present in the request headers
    const parsedCookies: { [key: string]: string } =
      Cookie.parse(headerCookies);
    req.cookies = parsedCookies;
    await this.authenticationService.canActivate(req, req.res, true);
  }

  /**
   * Makes sure a user is authorized to proxy before proxying websockets
   * @param req the server request instance
   */
  private async authorizeWebsocket(
    req: RequestWithDeploymentAndUser,
  ): Promise<void> {
    const canActivate: boolean = await this.authorize(req);
    if (!canActivate) throw new ForbiddenException();
  }
}
