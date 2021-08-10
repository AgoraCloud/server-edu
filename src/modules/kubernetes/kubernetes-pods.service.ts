import { KubeUtil } from './utils/kube.util';
import { DeploymentDocument } from './../deployments/schemas/deployment.schema';
import { MetricsDto } from '@agoracloud/common';
import { DeploymentPodMetricsNotAvailableException } from '../../exceptions/deployment-pod-metrics-not-available.exception';
import { DeploymentPodNotAvailableException } from '../../exceptions/deployment-pod-not-available.exception';
import { Inject, Injectable } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import * as http from 'http';
import * as request from 'request';

@Injectable()
export class KubernetesPodsService {
  constructor(
    @Inject(k8s.KubeConfig) private readonly kc: k8s.KubeConfig,
    @Inject(k8s.CoreV1Api) private readonly k8sCoreV1Api: k8s.CoreV1Api,
  ) {}

  /**
   * Get all Kubernetes pods
   * @param namespace the Kubernetes namespace
   * @returns a list of all Kubernetes pods
   */
  async getAllPods(namespace: string): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1PodList;
  }> {
    return this.k8sCoreV1Api.listNamespacedPod(
      namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      KubeUtil.resourcePrefixLabelSelector,
    );
  }

  /**
   * Get a Kubernetes pod
   * @param namespace the Kubernetes namespace
   * @param deploymentId the pods deployment id
   * @returns a Kubernetes pod
   */
  async getPod(namespace: string, deploymentId: string): Promise<k8s.V1Pod> {
    const {
      body: { items: pods },
    } = await this.k8sCoreV1Api.listNamespacedPod(
      namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      `${KubeUtil.resourcePrefixLabelSelector},deployment=${deploymentId}`,
    );
    // Even though the method above should return 0 or 1 pod(s), filter the
    // pods by the deployment label to be sure
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
   * @returns a Kubernetes pod logs
   */
  async getPodLogs(workspaceId: string, deploymentId: string): Promise<string> {
    const namespace: string = KubeUtil.generateResourceName(workspaceId);
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
   * @param deployment the pods deployment
   * @returns the metrics of the Kubernetes pod
   */
  async getPodMetrics(
    workspaceId: string,
    deployment: DeploymentDocument,
  ): Promise<MetricsDto> {
    const namespace: string = KubeUtil.generateResourceName(workspaceId);
    const deploymentId: string = deployment._id.toString();
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
      (c) => c.name === KubeUtil.generateResourceName(deploymentId),
    );
    if (containerIndex === -1) {
      throw new DeploymentPodMetricsNotAvailableException(deploymentId);
    }
    const containerMetrics: MetricsDto = new MetricsDto({
      cpu: KubeUtil.toPercentage(
        containers[containerIndex].usage?.cpu,
        deployment.properties.resources.cpuCount,
      ),
      memory: KubeUtil.toPercentage(
        containers[containerIndex].usage?.memory,
        deployment.properties.resources.memoryCount,
      ),
    });
    if (!containerMetrics?.cpu && !containerMetrics?.memory) {
      throw new DeploymentPodMetricsNotAvailableException(deploymentId);
    }
    return containerMetrics;
  }

  /**
   * Creates a namespaced pod list function for use with a Kubernetes informer
   * @param namespace the Kubernetes namespace
   * @returns the created namespaced pod list function
   */
  makeNamespacedPodListFunction(namespace: string): () => Promise<{
    response: http.IncomingMessage;
    body: k8s.V1PodList;
  }> {
    return (): Promise<{
      response: http.IncomingMessage;
      body: k8s.V1PodList;
    }> => this.k8sCoreV1Api.listNamespacedPod(namespace);
  }
}
