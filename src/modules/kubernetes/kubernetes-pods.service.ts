import { MetricsDto } from './dto/metrics.dto';
import { DeploymentPodMetricsNotAvailableException } from '../../exceptions/deployment-pod-metrics-not-available.exception';
import { DeploymentPodNotAvailableException } from '../../exceptions/deployment-pod-not-available.exception';
import { Inject, Injectable } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import * as http from 'http';
import * as request from 'request';
import { generateResourceName } from './helpers';

@Injectable()
export class KubernetesPodsService {
  constructor(
    @Inject(k8s.KubeConfig) private readonly kc: k8s.KubeConfig,
    @Inject(k8s.CoreV1Api) private readonly k8sCoreV1Api: k8s.CoreV1Api,
  ) {}

  /**
   * Get all Kubernetes pods
   * @param namespace the Kubernetes namespace
   */
  async getAllPods(
    namespace: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1PodList;
  }> {
    return this.k8sCoreV1Api.listNamespacedPod(
      namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      'deployment',
    );
  }

  /**
   * Get a Kubernetes pod
   * @param namespace the Kubernetes namespace
   * @param deploymentId the pods deployment id
   */
  async getPod(namespace: string, deploymentId: string): Promise<k8s.V1Pod> {
    // Get all pods
    const {
      body: { items: pods },
    } = await this.getAllPods(namespace);
    // Filter the pods by the deployment label
    const podIndex: number = pods.findIndex(
      (p) =>
        p.metadata?.labels?.deployment === deploymentId && p.metadata?.name,
    );
    if (podIndex === -1) {
      throw new DeploymentPodNotAvailableException(deploymentId);
    }
    return pods[podIndex];
  }

  /**
   * Get a Kubernetes pod logs
   * @param workspaceId the pods workspace id
   * @param deploymentId the pods deployment id
   */
  async getPodLogs(workspaceId: string, deploymentId: string): Promise<string> {
    const namespace: string = generateResourceName(workspaceId);
    const pod: k8s.V1Pod = await this.getPod(namespace, deploymentId);
    const { body } = await this.k8sCoreV1Api.readNamespacedPodLog(
      pod.metadata.name,
      namespace,
    );
    return body;
  }

  /**
   * Get a Kubernetes pod metrics
   * @param workspaceId the pods workspace id
   * @param deploymentId the pods deployment id
   */
  async getPodMetrics(
    workspaceId: string,
    deploymentId: string,
  ): Promise<MetricsDto> {
    const namespace: string = generateResourceName(workspaceId);
    const pod: k8s.V1Pod = await this.getPod(namespace, deploymentId);
    const opts: request.Options = {
      url: '',
    };
    await this.kc.applyToRequest(opts);
    const response: any = await new Promise((resolve, reject) => {
      request.get(
        `${
          this.kc.getCurrentCluster().server
        }/apis/metrics.k8s.io/v1beta1/namespaces/${namespace}/pods/${
          pod.metadata.name
        }`,
        opts,
        (error, response, body) => {
          if (error) reject(error);
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        },
      );
    });

    // Validate the response
    if (!Array.isArray(response?.containers)) {
      throw new DeploymentPodMetricsNotAvailableException(deploymentId);
    }
    const containers: any[] = response.containers as any[];
    const containerIndex: number = containers.findIndex(
      (c) => c.name === generateResourceName(deploymentId),
    );
    if (containerIndex === -1) {
      throw new DeploymentPodMetricsNotAvailableException(deploymentId);
    }
    const containerMetrics: MetricsDto = containers[containerIndex].usage;
    if (!containerMetrics?.cpu && !containerMetrics?.memory) {
      throw new DeploymentPodMetricsNotAvailableException(deploymentId);
    }
    return containerMetrics;
  }

  /**
   * Creates a namespaced pod list function for use with a Kubernetes informer
   * @param namespace the Kubernetes namespace
   */
  makeNamespacedPodListFunction(
    namespace: string,
  ): () => Promise<{
    response: http.IncomingMessage;
    body: k8s.V1PodList;
  }> {
    return (): Promise<{
      response: http.IncomingMessage;
      body: k8s.V1PodList;
    }> => this.k8sCoreV1Api.listNamespacedPod(namespace);
  }
}
