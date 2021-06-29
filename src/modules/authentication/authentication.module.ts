import { accessTokenConstants } from './constants';
import { TokensModule } from './../tokens/tokens.module';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy';
import { Global, Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Config, JwtConfig } from '../../config/configuration.interface';

@Global()
@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<Config>) => ({
        secret: configService.get<JwtConfig>('jwt').access.secret,
        signOptions: {
          expiresIn: accessTokenConstants.expirationTime,
        },
      }),
    }),
    TokensModule,
  ],
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}
