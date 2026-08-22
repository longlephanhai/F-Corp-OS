import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { SkillEvidence } from './entities/skill-evidence.entity';
import { UserSkill } from 'modules/user-skill/entities/user-skill.entity';
import { NotificationsService } from '../notifications/notifications.service';

export type EvidenceStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export class VerifyEvidenceDto {
  @IsIn(['PENDING', 'APPROVED', 'REJECTED'])
  status: EvidenceStatus;

  @IsOptional()
  @IsString()
  rejectReason?: string;
}

@Injectable()
export class SkillEvidencesService {
  constructor(
    @InjectRepository(SkillEvidence)
    private readonly evidenceRepo: Repository<SkillEvidence>,

    @InjectRepository(UserSkill)
    private readonly userSkillRepo: Repository<UserSkill>,

    private readonly notificationsService: NotificationsService,
  ) {}

  async verifyEvidence(id: string, updateData: VerifyEvidenceDto) {
    const evidence = await this.evidenceRepo.findOne({
      where: { id },
      relations: {
        userSkill: true,
      },
    });

    if (!evidence) {
      throw new NotFoundException('Không tìm thấy Bằng chứng này');
    }

    evidence.status = updateData.status;

    if (updateData.rejectReason) {
      evidence.rejectReason = updateData.rejectReason;
    }

    await this.evidenceRepo.save(evidence);

    if (updateData.status === 'APPROVED' && evidence.userSkill) {
      evidence.userSkill.confidenceScore = 100;

      await this.userSkillRepo.save(evidence.userSkill);
    }

    return evidence;
  }

  async uploadEvidence(data: DeepPartial<SkillEvidence>) {
    // ================================
    // 1. LƯU EVIDENCE
    // ================================

    const payload: DeepPartial<SkillEvidence> = {
      ...data,
      status: 'PENDING',
    };

    const newEvidence: SkillEvidence = this.evidenceRepo.create(payload);

    const savedEvidence: SkillEvidence =
      await this.evidenceRepo.save(newEvidence);

    // ================================
    // 2. TÌM USER SKILL + DEV + SKILL
    // ================================

    const userSkill = await this.userSkillRepo.findOne({
      where: {
        id: savedEvidence.userSkillId,
      },

      relations: {
        user: true,
        skill: true,
      },
    });

    if (!userSkill) {
      return savedEvidence;
    }

    const developer = userSkill.user;
    const managerId = developer?.managerId;

    // ================================
    // 3. GỬI NOTIFICATION CHO MANAGER
    // ================================

    if (managerId) {
      await this.notificationsService.createForUser({
        userId: managerId,

        title: 'Bằng chứng mới chờ duyệt',

        description:
          `${developer.fullName} vừa nộp bằng chứng ` +
          `cho kỹ năng ${userSkill.skill?.name ?? ''}.`,

        type: 'info',
      });
    }

    return savedEvidence;
  }
}
