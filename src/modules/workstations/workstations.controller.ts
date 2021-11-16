import { CustomAuditResourceDto } from './../auditing/dto/custom-audit-resource.dto';
import { ActionDto, AuditActionDto, ExceptionDto } from '@agoracloud/common';
import { WorkstationDto } from './dto/workstation.dto';
import { WorkstationDocument } from './schema/workstation.schema';
import { FindOneParams } from './../../utils/find-one-params';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { WorkstationsService } from './workstations.service';
import { CreateWorkstationDto } from './dto/create-workstation.dto';
import { UpdateWorkstationDto } from './dto/update-workstation.dto';
import {
  ApiCookieAuth,
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiParam,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Auth } from '../../decorators/auth.decorator';
import { User } from '../../decorators/user.decorator';
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

  /**
   * Get a workstation, accessible by super admins only
   * @param workstationId the workstation id
   * @returns the workstation document
   */
  @Get('workstations/:id')
  @Permissions(ActionDto.ManageUser)
  @Audit(AuditActionDto.Read, CustomAuditResourceDto.Workstation)
  @ApiParam({ name: 'id', description: 'The workstation id' })
  @ApiOperation({ summary: 'Get a workstation' })
  @ApiOkResponse({
    description: 'The workstation has been successfully retrieved',
    type: WorkstationDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided workstation id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workstation with the given id was not found',
    type: ExceptionDto,
  })
  findOne(
    @Param() { id: workstationId }: FindOneParams,
  ): Promise<WorkstationDocument> {
    return this.workstationsService.findOne(workstationId);
  }

  /**
   * Get the logged in users workstation
   * @param userId the user id
   * @returns the logged in user workstation document
   */
  @Get('workstation')
  @Audit(AuditActionDto.Read, CustomAuditResourceDto.Workstation)
  @ApiOperation({ summary: 'Get the logged in users workstation' })
  @ApiOkResponse({
    description: 'The workstation has been successfully retrieved',
    type: WorkstationDto,
  })
  @ApiBadRequestResponse({
    description: 'The user has no provisioned workstation',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  find(@User('_id') userId: string): Promise<WorkstationDocument> {
    return this.workstationsService.findByUserId(userId);
  }

  /**
   * Update a workstation, accessible by super admins only
   * @param workstationId the workstation id
   * @param updateWorkstationDto the updated workstation
   * @returns the updated workstation document
   */
  @ApiParam({ name: 'id', description: 'The workstation id' })
  @ApiOperation({ summary: 'Update a workstation' })
  @ApiOkResponse({
    description: 'The workstation has been successfully updated',
    type: WorkstationDto,
  })
  @ApiBadRequestResponse({
    description: 'The provided workstation or workstation id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workstation with the given id was not found',
    type: ExceptionDto,
  })
  @Put('workstations/:id')
  @Permissions(ActionDto.ManageUser)
  @Audit(AuditActionDto.Update, CustomAuditResourceDto.Workstation)
  update(
    @Param() { id: workstationId }: FindOneParams,
    @Body() updateWorkstationDto: UpdateWorkstationDto,
  ): Promise<WorkstationDocument> {
    return this.workstationsService.update(workstationId, updateWorkstationDto);
  }

  /**
   * Delete a workstation, accessible by super admins only
   * @param workstationId the workstation id
   */
  @ApiParam({ name: 'id', description: 'The workstation id' })
  @ApiOperation({ summary: 'Delete a workstation' })
  @ApiOkResponse({
    description: 'The workstation has been successfully deleted',
  })
  @ApiBadRequestResponse({
    description: 'The provided workstation id was not valid',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ExceptionDto })
  @ApiNotFoundResponse({
    description: 'The workstation with the given id was not found',
    type: ExceptionDto,
  })
  @Delete('workstations/:id')
  @Permissions(ActionDto.ManageUser)
  @Audit(AuditActionDto.Delete, CustomAuditResourceDto.Workstation)
  remove(@Param() { id: workstationId }: FindOneParams): Promise<void> {
    return this.workstationsService.remove(workstationId);
  }
}
