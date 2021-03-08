import { ExceptionDto } from './../../utils/base.dto';
import {
  ApiTags,
  ApiCookieAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { UserDto } from './dto/user.dto';
import { TransformInterceptor } from './../../interceptors/transform.interceptor';
import {
  Controller,
  Get,
  Body,
  Put,
  Delete,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../../decorators/user.decorator';
import { UserDocument } from '../users/schemas/user.schema';
import { Auth } from '../../decorators/auth.decorator';

@ApiCookieAuth()
@ApiTags('Users')
@Auth()
@Controller('api/user')
@UseInterceptors(new TransformInterceptor(UserDto))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get the logged in user
   * @param user the user
   */
  @Get()
  @ApiOperation({ summary: 'Get the logged in user' })
  @ApiOkResponse({
    description: 'The user has been successfully retrieved',
    type: UserDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  find(@User() user: UserDocument): UserDocument {
    return user;
  }

  /**
   * Update the logged in user
   * @param userId the users id
   * @param updateUserDto the updated user
   */
  @Put()
  @ApiOperation({ summary: 'Update the logged in user' })
  @ApiOkResponse({
    description: 'The user has been successfully updated',
    type: UserDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided user was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  update(
    @User('_id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    return this.usersService.update(userId, updateUserDto);
  }

  /**
   * Delete the logged in user
   * @param userId the users id
   */
  @Delete()
  @ApiOperation({ summary: 'Delete the logged in user' })
  @ApiOkResponse({ description: 'The user has been successfully deleted' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  async remove(@User('_id') userId: string): Promise<void> {
    return this.usersService.remove(userId);
  }
}
