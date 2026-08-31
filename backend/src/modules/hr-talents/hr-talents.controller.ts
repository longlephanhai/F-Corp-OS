import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ResponseMessage } from 'decorator/customize';
import { GetHrTalentsDto } from './dto/get-hr-talents.dto';
import { HrTalentsService } from './hr-talents.service';
import { GetHrSkillMatrixDto } from './dto/get-hr-skill-matrix.dto';
import { GetHrSkillEmployeesDto } from './dto/get-hr-skill-employees.dto';
import { GetHrTalentDataQualityDto } from './dto/get-hr-talent-data-quality.dto';

@Controller('hr-talents')
export class HrTalentsController {
  constructor(
    private readonly hrTalentsService: HrTalentsService,
  ) { }

  /**
   * GET /api/v1/hr-talents
   *
   * HR Talent Directory.
   *
   * Không dùng @SkipCheckPermission().
   * Endpoint phải đi qua permission system hiện tại.
   */
  @Get()
  @ResponseMessage(
    'Lấy danh sách hồ sơ năng lực nhân sự thành công',
  )
  findAll(
    @Query()
    query: GetHrTalentsDto,
  ) {
    return this.hrTalentsService.findAll(
      query,
    );
  }

  @Get('analytics/skill-supply-summary')
  @ResponseMessage(
    'Lấy tổng quan nguồn cung kỹ năng thành công',
  )
  getSkillSupplySummary() {
    return this.hrTalentsService.getSkillSupplySummary();
  }

  @Get('analytics/data-quality')
  @ResponseMessage(
    'Lấy chất lượng dữ liệu hồ sơ năng lực thành công',
  )
  getTalentDataQuality(
    @Query()
    query: GetHrTalentDataQualityDto,
  ) {
    return this.hrTalentsService.getTalentDataQuality(
      query,
    );
  }

  @Get('analytics/skill-matrix')
  @ResponseMessage(
    'Lấy ma trận kỹ năng nhân sự thành công',
  )
  getSkillMatrix(
    @Query()
    query: GetHrSkillMatrixDto,
  ) {
    return this.hrTalentsService.getSkillMatrix(
      query,
    );
  }

  @Get('analytics/skills/:skillId/employees')
  @ResponseMessage(
    'Lấy danh sách nhân sự theo kỹ năng thành công',
  )
  getSkillEmployees(
    @Param(
      'skillId',
      new ParseUUIDPipe(),
    )
    skillId: string,

    @Query()
    query: GetHrSkillEmployeesDto,
  ) {
    return this.hrTalentsService.getSkillEmployees(
      skillId,
      query,
    );
  }

  @Get(':employeeId')
  @ResponseMessage(
    'Lấy hồ sơ năng lực nhân sự thành công',
  )
  findOne(
    @Param(
      'employeeId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    employeeId: string,
  ) {
    return this.hrTalentsService.findOne(
      employeeId,
    );
  }
}