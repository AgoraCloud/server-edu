export default () => ({
  environment: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10),
  domain: process.env.DOMAIN,
  databaseUri: process.env.DATABASE_URI,
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
  jwt: {
    access: {
      secret: process.env.JWT_ACCESS_SECRET,
    },
    refresh: {
      secret: process.env.JWT_REFRESH_SECRET,
    },
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE,
    username: process.env.SMTP_USERNAME,
    password: process.env.SMTP_PASSWORD,
  },
  kubernetes: {
    namespace: process.env.KUBERNETES_NAMESPACE,
    storageClass: process.env.KUBERNETES_STORAGE_CLASS,
    serviceAccount: process.env.KUBERNETES_SERVICE_ACCOUNT,
  },
});
