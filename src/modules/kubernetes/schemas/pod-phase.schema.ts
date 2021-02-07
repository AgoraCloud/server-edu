// See https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-phase
export enum PodPhase {
  Pending = 'Pending',
  Running = 'Running',
  Succeeded = 'Succeeded',
  Failed = 'Failed',
  Unknown = 'Unknown',
}
