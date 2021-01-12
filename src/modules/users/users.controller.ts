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
  find(@User('email') email: string): Promise<UserDocument> {
    return this.usersService.findByEmail(email);
  }

  @Put()
  update(
    @User('email') email: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    return this.usersService.update(email, updateUserDto);
  }

  @Delete()
  async remove(@User('email') email: string): Promise<void> {
    return this.usersService.remove(email);
  }
}
