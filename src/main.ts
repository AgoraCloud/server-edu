import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { LoggerService } from './modules/logger/logger.service';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { Config, EnvironmentConfig } from './config/configuration.interface';
import {
  AuthTokenType,
  COOKIE_CONFIG,
} from './modules/authentication/config/cookie.config';

declare const module: any;

async function bootstrap() {
  const app: NestExpressApplication =
    await NestFactory.create<NestExpressApplication>(AppModule);
  // Use the custom LoggerService for logging
  app.useLogger(app.get(LoggerService));
  // Get configuration values
  const configService: ConfigService<Config> = app.get(ConfigService);
  const port: number = configService.get<number>('port');
  const environment: EnvironmentConfig =
    configService.get<EnvironmentConfig>('environment');
  const version: number = configService.get<number>('version');

  app.useGlobalPipes(
    new ValidationPipe({ forbidUnknownValues: true, whitelist: true }),
  );
  app.use(cookieParser());
  // TODO: figure out how to disable these for the /proxy endpoint
  // app.use(helmet());
  // app.enableCors();
  app.set('trust proxy', 1);
  // Swagger
  if (environment === EnvironmentConfig.Development) {
    const config: Pick<
      OpenAPIObject,
      'openapi' | 'info' | 'servers' | 'security' | 'tags' | 'externalDocs'
    > = new DocumentBuilder()
      .setTitle('AgoraCloud Server APIs')
      .setDescription('A list of all the AgoraCloud Server APIs')
      .setVersion(`v${version}`)
      .addCookieAuth(COOKIE_CONFIG[AuthTokenType.Access].name)
      .build();
    const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(port);

  // Hot Reload
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
