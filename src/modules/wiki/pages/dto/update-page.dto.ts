import { PartialType } from '@nestjs/mapped-types';
import { CreateWikiPageDto } from './create-page.dto';

export class UpdateWikiPageDto extends PartialType(CreateWikiPageDto) {}
