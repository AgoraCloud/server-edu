interface KubernetesConfig {
  namespace: string;
  storageClass: string;
  serviceAccount: string;
}

interface JwtConfig {
  access: {
    secret: string;
  };
  refresh: {
    secret: string;
  };
}

enum EnvironmentConfig {
  Development = 'development',
  Production = 'production',
}

interface AdminConfig {
  email: string;
  password: string;
}

export { KubernetesConfig, JwtConfig, EnvironmentConfig, AdminConfig };
