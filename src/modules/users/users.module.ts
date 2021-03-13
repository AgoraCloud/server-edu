import { TokensModule } from './../tokens/tokens.module';
import { User, UserSchema } from './schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Module, Global } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController, AdminUsersController } from './users.controller';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    TokensModule,
  ],
  controllers: [AdminUsersController, UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
