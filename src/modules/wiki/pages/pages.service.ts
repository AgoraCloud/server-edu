import { Injectable } from '@nestjs/common';
import { CreateWikiPageDto } from './dto/create-page.dto';
import { UpdateWikiPageDto } from './dto/update-page.dto';

@Injectable()
export class WikiPagesService {
  create(createWikiPageDto: CreateWikiPageDto) {
    return 'This action adds a new page';
  }

  findAll() {
    return `This action returns all pages`;
  }

  findOne(id: number) {
    return `This action returns a #${id} page`;
  }

  update(id: number, updateWikiPageDto: UpdateWikiPageDto) {
    return `This action updates a #${id} page`;
  }

  remove(id: number) {
    return `This action removes a #${id} page`;
  }
}
