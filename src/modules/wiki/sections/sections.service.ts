import { Injectable } from '@nestjs/common';
import { CreateWikiSectionDto } from './dto/create-section.dto';
import { UpdateWikiSectionDto } from './dto/update-section.dto';

@Injectable()
export class WikiSectionsService {
  create(createWikiSectionDto: CreateWikiSectionDto) {
    return 'This action adds a new section';
  }

  findAll() {
    return `This action returns all sections`;
  }

  findOne(id: number) {
    return `This action returns a #${id} section`;
  }

  update(id: number, updateWikiSectionDto: UpdateWikiSectionDto) {
    return `This action updates a #${id} section`;
  }

  remove(id: number) {
    return `This action removes a #${id} section`;
  }
}
