import { CreateShortcutDto, UpdateShortcutDto } from '@agoracloud/common';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ShortcutsService {
  create(createShortcutDto: CreateShortcutDto) {
    return 'This action adds a new shortcut';
  }

  findAll() {
    return `This action returns all shortcuts`;
  }

  findOne(id: number) {
    return `This action returns a #${id} shortcut`;
  }

  update(id: number, updateShortcutDto: UpdateShortcutDto) {
    return `This action updates a #${id} shortcut`;
  }

  remove(id: number) {
    return `This action removes a #${id} shortcut`;
  }
}
