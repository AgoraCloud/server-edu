import { DeploymentTypeDto } from '@agoracloud/common';

interface ContainerConfig {
  containerPort: number;
  volumeMountPath: string;
  passwordEnvVariable: string;
}

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
