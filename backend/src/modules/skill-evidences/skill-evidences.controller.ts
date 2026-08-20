import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  Logger,
  Get,
} from '@nestjs/common';
import {
  SkillEvidencesService,
  VerifyEvidenceDto,
} from './skill-evidences.service';
import {
  ResponseMessage,
  User,
  SkipCheckPermission,
} from 'decorator/customize';
// import { NotificationsGateway } from '../notifications/notifications.gateway';

@Controller('skill-evidences')
export class SkillEvidencesController {
  constructor(
    private readonly evidencesService: SkillEvidencesService,
    // private readonly notificationsGateway: NotificationsGateway
  ) {}

  @SkipCheckPermission()
  @Post()
  async submitEvidence(@Body() body: any) {
    console.log('📬 Đã nhận data nộp bằng chứng từ Postman:', body);
    Logger.debug('tao là khánh', body);
    // Gọi hàm uploadEvidence trong Service.
    // Hàm này sẽ tự động: Lưu DB -> Lấy ra ID mới -> Bắn Socket rung chuông!
    const savedEvidence = await this.evidencesService.uploadEvidence(body);

    return {
      statusCode: 201,
      message: 'Nộp bằng chứng thành công và đã rung chuông PM!',
      data: savedEvidence,
    };
  }

  // ==========================================================
  // 💥 Đã fix cứng type VerifyEvidenceDto cho biến body
  // ==========================================================
  @SkipCheckPermission()
  @Patch(':id/verify')
  async verifyEvidence(
    @Param('id') id: string,
    @Body() body: VerifyEvidenceDto, // Thay vì { status: string } như cũ
  ) {
    const data = await this.evidencesService.verifyEvidence(id, body);
    return {
      statusCode: 200,
      message: 'Cập nhật trạng thái bằng chứng thành công',
      data,
    };
  }
  @SkipCheckPermission()
  @Get('notifications/history')
  async getNotifications() {
    const data = await this.evidencesService.getNotifications();
    return { statusCode: 200, data };
  }
  @SkipCheckPermission()
  @Patch('notifications/read-all')
  async markAllAsRead() {
    return await this.evidencesService.markAllAsRead();
  }
  @SkipCheckPermission()
  @Patch('notifications/:id/read')
  async markAsRead(@Param('id') id: string) {
    return await this.evidencesService.markAsRead(id);
  }
}
