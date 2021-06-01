import { NotFoundException } from '@nestjs/common';

/**
 * An exception that is thrown when the user with the give email
 * was not found
 */
export class UserNotFoundException extends NotFoundException {
  constructor(email: string) {
    super(`User with email ${email} not found`);
  }
}

/**
 * An exception that is thrown when the user with the given id
 * was not found
 */
export class UserWithIdNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`User with id ${id} not found`);
  }
}
