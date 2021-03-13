import { CreateUserDto } from './dto/create-user.dto';
import { UserInterceptor } from './../../interceptors/user.interceptor';
import { Action } from './../authorization/schemas/permission.schema';
import { ExceptionDto } from './../../utils/base.dto';
import {
  ApiTags,
  ApiCookieAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiOperation,
  ApiParam,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { UserDto, AdminUserDto } from './dto/user.dto';
import { TransformInterceptor } from './../../interceptors/transform.interceptor';
import {
  Controller,
  Get,
  Body,
  Put,
  Delete,
  UseInterceptors,
  Post,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto, AdminUpdateUserDto } from './dto/update-user.dto';
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

@ApiCookieAuth()
@ApiTags('Users')
@Auth(Action.ManageUser)
@Controller('api/users')
@UseInterceptors(new TransformInterceptor(AdminUserDto))
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  // TODO: add comments and tags
  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<void> {
    return;
  }

  /**
   * Get all users, accessible by super admins only
   */
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiOkResponse({
    description: 'The users have been successfully retrieved',
    type: [AdminUserDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  findAll(): Promise<UserDocument[]> {
    return this.usersService.findAll();
  }

  /**
   * Update a user, accessible by super admins only
   * @param userId the users id
   * @param adminUpdateUserDto the updated user
   */
  @Put(':userId')
  @UseInterceptors(UserInterceptor)
  @ApiParam({ name: 'userId', description: 'The users id' })
  @ApiOperation({ summary: 'Update a user' })
  @ApiOkResponse({
    description: 'The user has been successfully updated',
    type: AdminUserDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided user or user id were not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The user with the given id was not found',
    type: ExceptionDto,
  })
  update(
    @Param('userId') userId: string,
    @Body() adminUpdateUserDto: AdminUpdateUserDto,
  ): Promise<UserDocument> {
    return this.usersService.adminUpdate(userId, adminUpdateUserDto);
  }

  /**
   * Delete a user, accessible by super admins only
   * @param userId the users id
   */
  @Delete(':userId')
  @ApiParam({ name: 'userId', description: 'The users id' })
  @ApiOperation({ summary: 'Delete a user' })
  @ApiOkResponse({
    description: 'The user has been successfully deleted',
  })
  @ApiBadRequestResponse({
    description: 'The provided user id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The user with the given id was not found',
    type: ExceptionDto,
  })
  @UseInterceptors(UserInterceptor)
  remove(@Param('userId') userId: string): Promise<void> {
    return this.usersService.remove(userId);
  }
}
