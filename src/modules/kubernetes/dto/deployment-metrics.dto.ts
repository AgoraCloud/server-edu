export class DeploymentMetricsDto {
  cpu: string;
  memory: string;

  constructor(cpu: string, memory: string) {
    this.cpu = cpu;
    this.memory = memory;
  }
}
