import { PartialType } from '@nestjs/mapped-types';
import { CreateWikiSectionDto } from './create-section.dto';

export class UpdateWikiSectionDto extends PartialType(CreateWikiSectionDto) {}
