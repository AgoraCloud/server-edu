import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { UserDto } from './dto/user.dto';
import { TransformInterceptor } from './../../interceptors/transform.interceptor';
import { JwtAuthenticationGuard } from '../authentication/guards/jwt-authentication.guard';
import {
  Controller,
  Get,
  Body,
  Put,
  Delete,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../../decorators/user.decorator';
import { UserDocument } from '../users/schemas/user.schema';

@ApiCookieAuth()
@ApiTags('Users')
@Controller('api/user')
@UseGuards(JwtAuthenticationGuard)
@UseInterceptors(new TransformInterceptor(UserDto))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get a user
   * @param user the user
   */
  @Get()
  find(@User() user: UserDocument): UserDocument {
    return user;
  }

  /**
   * Update a user
   * @param userId the users id
   * @param updateUserDto the updated user
   */
  @Put()
  update(
    @User('_id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    return this.usersService.update(userId, updateUserDto);
  }

  /**
   * Delete a user
   * @param userId the users id
   */
  @Delete()
  async remove(@User('_id') userId: string): Promise<void> {
    return this.usersService.remove(userId);
  }
}
