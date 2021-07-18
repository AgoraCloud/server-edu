import { isDefined } from 'class-validator';

export class KubeUtil {
  static resourcePrefix = 'agoracloud';

  /**
   * Convert a string to a base64 string
   * @param value the value to convert
   * @returns a base64 string
   */
  static toBase64(value: string): string {
    return Buffer.from(value).toString('base64');
  }

  /**
   * Generates labels for all Kubernetes resources for an AgoraCloud deployment
   * @param deploymentId the deployment id
   * @returns the generated deployment labels
   */
  static generateDeploymentLabels(deploymentId: string): {
    [key: string]: string;
  } {
    return { app: KubeUtil.resourcePrefix, deployment: deploymentId };
  }

  /**
   * Generates labels for all Kubernetes resources for an AgoraCloud workspace
   * @param workspaceId the workspace id
   * @returns the generated workspace labels
   */
  static generateWorkspaceLabels(workspaceId: string): {
    [key: string]: string;
  } {
    return { app: KubeUtil.resourcePrefix, workspace: workspaceId };
  }

  /**
   * Generates the name for any Kubernetes resource
   * @param id the id of the resource
   * @returns the generated resource name
   */
  static generateResourceName(id: string): string {
    return `${KubeUtil.resourcePrefix}-${id}`;
  }

  /**
   * Converts a Kubernetes metrics value to a percentage
   * @param val the current value
   * @param max the maximum value
   * @returns the calculated percentage
   */
  static toPercentage(val: string, max: number): number {
    if (!val || !isDefined(max)) return;

    /**
     * Converts a value to a percentage
     * @param endPos the last position of a number in the string
     * @param op the operation (division or multiplication)
     * @param operand the operand
     */
    const convert = (
      endPos?: number,
      op?: '*' | '/',
      operand?: number,
    ): number => {
      let v: number = +val.substring(0, endPos);
      if (op === '*') {
        v *= operand;
      } else if (op === '/') {
        v /= operand;
      }
      return Math.round((v / max) * 100);
    };

    if (val.includes('m')) {
      return convert(val.length - 1, '/', 1000);
    } else if (val.includes('n')) {
      return convert(val.length - 1, '/', 1000000000);
    } else if (val.includes('Ei')) {
      return convert(val.length - 2, '*', 1153000000);
    } else if (val.includes('Pi')) {
      return convert(val.length - 2, '*', 1126000);
    } else if (val.includes('Ti')) {
      return convert(val.length - 2, '*', 1100);
    } else if (val.includes('Gi')) {
      return convert(val.length - 2, '/', 1.074);
    } else if (val.includes('Mi')) {
      return convert(val.length - 2, '/', 954);
    } else if (val.includes('Ki')) {
      return convert(val.length - 2, '/', 976562);
    }
    return convert();
  }
}
