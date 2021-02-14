import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectLaneDto } from './create-lane.dto';

export class UpdateProjectLaneDto extends PartialType(CreateProjectLaneDto) {}
