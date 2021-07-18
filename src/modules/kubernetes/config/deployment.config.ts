import { DeploymentTypeDto } from '@agoracloud/common';

/**
 * Represents all the configuration settings needed to deploy
 * a container for a deployment in Kubernetes
 */
interface ContainerConfig {
  containerPort: number;
  volumeMountPath: string;
  passwordEnvVariable: string;
}

/**
 * Contains the container configuration for all deployment types
 */
const DEPLOYMENT_CONFIG: Record<DeploymentTypeDto, ContainerConfig> = {
  VSCODE: {
    containerPort: 8443,
    volumeMountPath: '/config',
    passwordEnvVariable: 'SUDO_PASSWORD',
  },
  UBUNTU: {
    containerPort: 3000,
    volumeMountPath: '/config',
    passwordEnvVariable: 'PASSWORD',
  },
};

export { ContainerConfig, DEPLOYMENT_CONFIG };
