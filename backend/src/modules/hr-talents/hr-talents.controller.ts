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