/**
 * The server Kubernetes configuration
 */
interface KubernetesConfig {
  namespace: string;
  storageClass: string;
  serviceAccount: string;
}

/**
 * The server access and refresh token configuration
 */
interface JwtConfig {
  access: {
    secret: string;
  };
  refresh: {
    secret: string;
  };
}

/**
 * The server environment configuration
 */
enum EnvironmentConfig {
  Development = 'development',
  Production = 'production',
}

/**
 * The server log level configuration
 */
enum LogLevel {
  Log = 'log',
  Error = 'error',
  Warn = 'warn',
  Debug = 'debug',
  Verbose = 'verbose',
}

/**
 * The server admin credentials configuration
 */
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
