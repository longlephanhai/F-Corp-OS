import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SkillEvidence } from './entities/skill-evidence.entity';
import { UserSkill } from '../user-skills/entities/user-skill.entity';

@Injectable()
export class SkillEvidencesService {
  constructor(
    @InjectRepository(SkillEvidence)
    private evidenceRepo: Repository<SkillEvidence>,
    @InjectRepository(UserSkill)
    private userSkillRepo: Repository<UserSkill>,
  ) {}

  // Hàm Duyệt hoặc Từ chối Bằng chứng
  async verifyEvidence(id: string, updateData: { status: string; rejectReason?: string }) {
    const evidence = await this.evidenceRepo.findOne({ 
      where: { id },
      relations: ['userSkill'] // Móc nối với bảng UserSkill để tí nữa tăng điểm
    });

    if (!evidence) throw new NotFoundException('Không tìm thấy Bằng chứng này');

    // Cập nhật trạng thái bằng chứng (verified hoặc rejected)
    evidence.status = updateData.status as any;
    if (updateData.rejectReason) {
      evidence.rejectReason = updateData.rejectReason; // Nếu có cột này trong DB
    }

    await this.evidenceRepo.save(evidence);

    if (updateData.status === 'verified' && evidence.userSkill) {
      evidence.userSkill.confidenceScore = 100;
      await this.userSkillRepo.save(evidence.userSkill);
    }

    return evidence;
  }
}