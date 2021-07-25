export class ProxyUtil {
  /**
   * Extracts the deployment id from the hostname in the request
   * @param hostname the hostname
   * @returns the deployment id
   */
  static getDeploymentIdFromHostname(hostname: string): string {
    return hostname.split('.')[0].slice(1);
  }

  /**
   * Generates a publicly accessible proxy URL for a deployment
   * @param baseDomain the AgoraCloud instance base domain
   * @param deploymentId the id of the deployment to be proxied
   * @returns the deployments publicly accessible proxy URL
   */
  static generatePublicProxyUrl(
    baseDomain: string,
    deploymentId: string,
  ): string {
    return `p${deploymentId}.${baseDomain}`;
  }
}
