import { ForbiddenException } from '@nestjs/common';

export class AccountDisabledException extends ForbiddenException {
  constructor(email: string) {
    super(`Account with email ${email} is disabled`);
  }
}
