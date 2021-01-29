import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';

declare const module: any;

async function bootstrap() {
  const app: NestExpressApplication = await NestFactory.create<NestExpressApplication>(
    AppModule,
  );
  // Get configuration values
  const configService: ConfigService = app.get(ConfigService);
  const port: number = configService.get<number>('port');

  app.useGlobalPipes(
    new ValidationPipe({ forbidUnknownValues: true, whitelist: true }),
  );
  app.use(cookieParser());
  // TODO: figure out how to disable these for the /proxy endpoint
  // app.use(helmet());
  // app.enableCors();
  app.set('trust proxy', 1);
  await app.listen(port);

  // Hot Reload
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
