import { ForbiddenException } from '@nestjs/common';

export class AccountNotVerifiedException extends ForbiddenException {
  constructor(email: string) {
    super(`Account with email ${email} is not verified`);
  }
}
