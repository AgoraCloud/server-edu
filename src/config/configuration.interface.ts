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

interface AdminConfig {
  email: string;
  password: string;
}

export { KubernetesConfig, JwtConfig, EnvironmentConfig, AdminConfig };
