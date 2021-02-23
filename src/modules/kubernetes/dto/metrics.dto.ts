export class MetricsDto {
  readonly cpu: string;
  readonly memory: string;
  readonly storage: string;

  constructor(cpu?: string, memory?: string, storage?: string) {
    this.cpu = cpu;
    this.memory = memory;
    this.storage = storage;
  }
}
