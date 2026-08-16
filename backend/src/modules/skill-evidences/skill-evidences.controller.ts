import { Controller, Patch, Param, Body } from '@nestjs/common';
import { SkillEvidencesService } from './skill-evidences.service';

@Controller('skill-evidences')
export class SkillEvidencesController {
  constructor(private readonly evidencesService: SkillEvidencesService) {}

  @Patch(':id/verify')
  async verifyEvidence(
    @Param('id') id: string,
    @Body() body: { status: string; rejectReason?: string }
  ) {
    const data = await this.evidencesService.verifyEvidence(id, body);
    return { statusCode: 200, message: 'Cập nhật trạng thái bằng chứng thành công', data };
  }
}