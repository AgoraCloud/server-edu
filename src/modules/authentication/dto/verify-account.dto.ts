import { IsMongoId } from 'class-validator';

export class VerifyAccountDto {
  @IsMongoId()
  readonly token: string;
}
