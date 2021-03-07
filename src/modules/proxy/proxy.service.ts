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
  InternalServerErrorException,
} from '@nestjs/common';
import * as HttpProxy from 'http-proxy';
import { Server } from 'http';
import { Socket } from 'net';
import { resourcePrefix } from '../kubernetes/helpers';

@Injectable()
export class ProxyService implements OnModuleInit {
  constructor(
    @Inject(HttpProxy) private readonly httpProxy: HttpProxy,
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly deploymentsService: DeploymentsService,
  ) {}

  onModuleInit(): void {
    this.onProxyError();
    this.proxyWebsockets();
  }

  /**
   * Handle proxy errors
   */
  private onProxyError(): void {
    this.httpProxy.on(
      'error',
      (err: Error, req: Request, res: Response, target: any) => {
        const exception: InternalServerErrorException = new InternalServerErrorException(
          `Error proxying ${target.host}`,
        );
        res.status(exception.getStatus()).json(exception.getResponse());
      },
    );
  }

  /**
   * Proxy all deployment websockets
   */
  private proxyWebsockets(): void {
    const httpServer: Server = this.httpAdapterHost.httpAdapter.getHttpServer();
    httpServer.on(
      'upgrade',
      async (req: Request, socket: Socket, head: any) => {
        const deploymentId: string = req.url.split('/')[2];
        if (!isMongoId(deploymentId)) {
          throw new InvalidMongoIdException('deploymentId');
        }
        const deployment: DeploymentDocument = await this.deploymentsService.findOne(
          deploymentId,
        );
        req.url = this.removeProxyUrlPrefix(req.url, deploymentId);
        this.httpProxy.ws(
          req,
          socket,
          head,
          this.makeProxyOptions(deployment.workspace._id, deploymentId),
        );
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
    const deploymentId: string = deployment._id;
    req.url = this.removeProxyUrlPrefix(req.url, deploymentId);
    this.httpProxy.web(
      req,
      res,
      this.makeProxyOptions(deployment.workspace._id, deploymentId),
    );
  }

  /**
   * Dynamically creates configuration options for the proxy
   * @param workspaceId the deployments workspace id
   * @param deploymentId the deployment id
   */
  private makeProxyOptions(
    workspaceId: string,
    deploymentId: string,
  ): HttpProxy.ServerOptions {
    return {
      target: `http://${resourcePrefix}-${deploymentId}.${resourcePrefix}-${workspaceId}.svc.cluster.local`,
      changeOrigin: true,
    };
  }

  /**
   * Removes the /proxy/:deploymentId prefix from request urls
   * @param requestUrl the request url
   * @param deploymentId the deployment id
   */
  private removeProxyUrlPrefix(
    requestUrl: string,
    deploymentId: string,
  ): string {
    return requestUrl.replace(`/proxy/${deploymentId}`, '');
  }
}
