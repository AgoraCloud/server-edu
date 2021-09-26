/**
 * Used to track how many Kubernetes resources were deleted in the
 * delete remaining kubernetes resources chron job
 */
export type DeletedKubernetesResourcesCount = {
  services: number;
  deployments: number;
  persistentVolumeClaims: number;
  secrets: number;
};
