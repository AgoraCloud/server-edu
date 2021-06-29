/**
 * The server configuration
 */
interface Config extends AppConfig {
  admin: AdminConfig;
  jwt: JwtConfig;
  smtp: SmtpConfig;
  kubernetes: KubernetesConfig;
}

/**
 * The server top-level application configuration
 */
interface AppConfig {
  version: string;
  environment: EnvironmentConfig;
  port: number;
  logLevel: LogLevel[];
  domain: string;
  databaseUri: string;
}

/**
 * The server admin credentials configuration
 */
interface AdminConfig {
  email: string;
  password: string;
}

/**
 * The server access and refresh token configuration
 */
interface JwtConfig {
  access: JwtAccessConfig;
  refresh: JwtRefreshConfig;
}

/**
 * The server JWT access configuration
 */
interface JwtAccessConfig {
  secret: string;
}

/**
 * The server JWT refresh configuration
 */
interface JwtRefreshConfig {
  secret: string;
}

/**
 * The server SMTP configuration
 */
interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

/**
 * The server Kubernetes configuration
 */
interface KubernetesConfig {
  namespace: string;
  storageClass: string;
  serviceAccount: string;
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

export {
  Config,
  AppConfig,
  AdminConfig,
  JwtConfig,
  JwtAccessConfig,
  JwtRefreshConfig,
  SmtpConfig,
  KubernetesConfig,
  EnvironmentConfig,
  LogLevel,
};
