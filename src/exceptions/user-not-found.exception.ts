import { NotFoundException } from '@nestjs/common';

export class UserNotFoundException extends NotFoundException {
  constructor(email: string) {
    super(`User with email ${email} not found`);
  }
}

export class UserWithIdNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`User with id ${id} not found`);
  }
}
