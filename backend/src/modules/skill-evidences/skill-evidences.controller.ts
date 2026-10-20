import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import {
  SkillEvidencesService,
  VerifyEvidenceDto,
} from './skill-evidences.service';
import { SkipCheckPermission, User } from 'decorator/customize';
import type { IUser } from 'common/types/user.interface';
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
  @Patch(':id/verify')
  async verifyEvidence(
    @Param('id') id: string,
    @Body() body: VerifyEvidenceDto, // Thay vì { status: string } như cũ
    @User() user: IUser,
  ) {
    const data = await this.evidencesService.verifyEvidence(id, body, user);
    return {
      statusCode: 200,
      message: 'Cập nhật trạng thái bằng chứng thành công',
      data,
    };
  }
}
