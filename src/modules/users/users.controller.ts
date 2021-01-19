import { JwtAuthenticationGuard } from 'src/modules/authentication/guards/jwt-authentication.guard';
import { Controller, Get, Body, Put, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from 'src/decorators/user.decorator';
import { UserDocument } from 'src/modules/users/schemas/user.schema';

@Controller('api/user')
@UseGuards(JwtAuthenticationGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  find(@User() user: UserDocument): UserDocument {
    return user;
  }

  @Put()
  update(
    @User('_id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    return this.usersService.update(userId, updateUserDto);
  }

  @Delete()
  async remove(@User('_id') userId: string): Promise<void> {
    return this.usersService.remove(userId);
  }
}
