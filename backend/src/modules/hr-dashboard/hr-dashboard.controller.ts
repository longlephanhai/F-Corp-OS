import {
  Controller,
  Get,
} from '@nestjs/common';

import {
  ResponseMessage,
} from 'decorator/customize';

import {
  HrDashboardService,
} from './hr-dashboard.service';

@Controller('hr-dashboard')
export class HrDashboardController {
  constructor(
    private readonly hrDashboardService:
      HrDashboardService,
  ) {}

  @Get('summary')
  @ResponseMessage(
    'Lấy tổng quan HR Dashboard thành công',
  )
  getSummary() {
    return this.hrDashboardService
      .getSummary();
  }
}