import { CustomAuditResourceDto } from './../auditing/dto/custom-audit-resource.dto';
import { ActionDto, AuditActionDto, ExceptionDto } from '@agoracloud/common';
import { WorkstationDto } from './dto/workstation.dto';
import { WorkstationDocument } from './schema/workstation.schema';
import { Controller, Get, Post, Body } from '@nestjs/common';
import { WorkstationsService } from './workstations.service';
import { CreateWorkstationDto } from './dto/create-workstation.dto';
import {
  ApiCookieAuth,
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Auth } from '../../decorators/auth.decorator';
import { Transform } from '../../decorators/transform.decorator';
import { Permissions } from '../../decorators/permissions.decorator';
import { Audit } from '../../decorators/audit.decorator';

@ApiCookieAuth()
@ApiTags('Workstations')
@Controller('api')
@Auth()
@Transform(WorkstationDto)
export class WorkstationsController {
  constructor(private readonly workstationsService: WorkstationsService) {}

  /**
   * Create a new workstation, accessible by super admins only
   * @param createWorkstationDto the workstation to create
   * @returns the created workstation document
   */
  @Post('workstations')
  @Permissions(ActionDto.ManageUser)
  @Audit(AuditActionDto.Create, CustomAuditResourceDto.Workstation)
  @ApiOperation({ summary: 'Create a workstation' })
  @ApiCreatedResponse({
    description: 'The workstation has been successfully created',
    type: WorkstationDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided workstation was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  create(
    @Body() createWorkstationDto: CreateWorkstationDto,
  ): Promise<WorkstationDocument> {
    return this.workstationsService.create(createWorkstationDto);
  }

  /**
   * Get all workstations, accessible by super admins only
   * @returns an array of workstation documents
   */
  @Get('workstations')
  @Permissions(ActionDto.ManageUser)
  @Audit(AuditActionDto.Read, CustomAuditResourceDto.Workstation)
  @ApiOperation({ summary: 'Get all workstations' })
  @ApiOkResponse({
    description: 'The workstations have been successfully retrieved',
    type: [WorkstationDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  findAll(): Promise<WorkstationDocument[]> {
    return this.workstationsService.findAll();
  }
}
