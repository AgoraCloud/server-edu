interface KubernetesConfig {
  namespace: string;
  storageClass: string;
}

interface JwtConfig {
  access: {
    secret: string;
    expirationTime: string;
  };
  refresh: {
    secret: string;
    expirationTime: string;
  };
}

enum EnvironmentConfig {
  Development = 'development',
  Production = 'production',
}

export { KubernetesConfig, JwtConfig, EnvironmentConfig };
