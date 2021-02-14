import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { LanesService } from './lanes.service';
import { CreateLaneDto } from './dto/create-lane.dto';
import { UpdateLaneDto } from './dto/update-lane.dto';

@Controller('lanes')
export class LanesController {
  constructor(private readonly lanesService: LanesService) {}

  @Post()
  create(@Body() createLaneDto: CreateLaneDto) {
    return this.lanesService.create(createLaneDto);
  }

  @Get()
  findAll() {
    return this.lanesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lanesService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateLaneDto: UpdateLaneDto) {
    return this.lanesService.update(+id, updateLaneDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lanesService.remove(+id);
  }
}
