export class DeploymentMetricsDto {
  readonly cpu: string;
  readonly memory: string;

  constructor(cpu: string, memory: string) {
    this.cpu = cpu;
    this.memory = memory;
  }
}
