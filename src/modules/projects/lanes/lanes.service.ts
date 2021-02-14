import { Injectable } from '@nestjs/common';
import { CreateLaneDto } from './dto/create-lane.dto';
import { UpdateLaneDto } from './dto/update-lane.dto';

@Injectable()
export class LanesService {
  create(createLaneDto: CreateLaneDto) {
    return 'This action adds a new lane';
  }

  findAll() {
    return `This action returns all lanes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} lane`;
  }

  update(id: number, updateLaneDto: UpdateLaneDto) {
    return `This action updates a #${id} lane`;
  }

  remove(id: number) {
    return `This action removes a #${id} lane`;
  }
}
