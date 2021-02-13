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

enum LogLevel {
  Log = 'log',
  Error = 'error',
  Warn = 'warn',
  Debug = 'debug',
  Verbose = 'verbose',
}

interface AdminConfig {
  email: string;
  password: string;
}

export {
  KubernetesConfig,
  JwtConfig,
  EnvironmentConfig,
  LogLevel,
  AdminConfig,
};
