export class ProxyUtil {
  /**
   * Extracts the deployment id from the hostname in the request
   * @param hostname the hostname
   * @returns the deployment id
   */
  static getDeploymentIdFromHostname(hostname: string): string {
    return hostname.split('.')[0].slice(1);
  }
}
