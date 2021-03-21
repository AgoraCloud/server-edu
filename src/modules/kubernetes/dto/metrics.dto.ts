export class MetricsDto {
  readonly cpu?: number;
  readonly memory?: number;
  readonly storage?: number;

  constructor(cpu?: number, memory?: number, storage?: number) {
    this.cpu = cpu;
    this.memory = memory;
    this.storage = storage;
  }
}
