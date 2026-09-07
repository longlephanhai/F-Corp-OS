import { Controller, Get, Req, UseGuards } from '@nestjs/common';

import { SkipCheckPermission } from 'decorator/customize';

import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

import { PmActionCenterService } from './pm-action-center.service';

@UseGuards(JwtAuthGuard)
@SkipCheckPermission()
@Controller('pm-action-center')
export class PmActionCenterController {
  constructor(private readonly pmActionCenterService: PmActionCenterService) {}

  @Get()
  async getActionCenter(
    @Req()
    req: any,
  ) {
    const data = await this.pmActionCenterService.getActionCenter(req.user.id);

    return {
      statusCode: 200,

      message: 'Lấy danh sách việc cần xử lý thành công',

      data,
    };
  }
}
