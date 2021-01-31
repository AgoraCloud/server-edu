// See https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-conditions
enum PodConditionType {
  PodScheduled = 'PodScheduled',
  ContainersReady = 'ContainersReady',
  Initialized = 'Initialized',
  Ready = 'Ready',
}

enum PodConditionStatus {
  True = 'True',
  False = 'False',
  Unknown = 'Unknown',
}

enum PodConditionReason {
  Unschedulable = 'Unschedulable',
}

export { PodConditionType, PodConditionStatus, PodConditionReason };
