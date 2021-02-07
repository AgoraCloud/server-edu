import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/users/users.module';
import { AuthenticationModule } from './modules/authentication/authentication.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { TokensModule } from './modules/tokens/tokens.module';
import configuration from './config/configuration';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailModule } from './modules/mail/mail.module';
import { DeploymentsModule } from './modules/deployments/deployments.module';
import { KubernetesModule } from './modules/kubernetes/kubernetes.module';
import { ProxyModule } from './modules/proxy/proxy.module';
import * as Joi from '@hapi/joi';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [configuration],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production')
          .default('development'),
        PORT: Joi.number().default(3000),
        DOMAIN: Joi.string().required(),
        DATABASE_URI: Joi.string().required(),
        ADMIN_EMAIL: Joi.string().email().required(),
        ADMIN_PASSWORD: Joi.string().min(8).required(),
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        SMTP_HOST: Joi.string().required(),
        SMTP_PORT: Joi.number().required(),
        SMTP_SECURE: Joi.boolean().required(),
        SMTP_USERNAME: Joi.string().required(),
        SMTP_PASSWORD: Joi.string().required(),
        KUBERNETES_NAMESPACE: Joi.string().required(),
        KUBERNETES_STORAGE_CLASS: Joi.string().required(),
        KUBERNETES_SERVICE_ACCOUNT: Joi.string().required(),
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('databaseUri'),
        useCreateIndex: true,
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('smtp.host'),
          port: configService.get<number>('smtp.port'),
          secure: configService.get<boolean>('smtp.secure'),
          auth: {
            user: configService.get<string>('smtp.username'),
            pass: configService.get<string>('smtp.password'),
          },
        },
        defaults: {
          from: `"AgoraCloud" <${configService.get<string>('smtp.username')}>`,
        },
        template: {
          dir: process.cwd() + '/templates/',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    AuthenticationModule,
    WorkspacesModule,
    TokensModule,
    EventEmitterModule.forRoot(),
    MailModule,
    DeploymentsModule,
    KubernetesModule,
    ProxyModule,
    HealthModule,
  ],
})
export class AppModule {}
