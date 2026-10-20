import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { SkillEvidence } from './entities/skill-evidence.entity';
import { UserSkill } from 'modules/user-skill/entities/user-skill.entity';
import { NotificationsService } from '../notifications/notifications.service';
import type { IUser } from 'common/types/user.interface';
import { User } from 'modules/users/entities/user.entity';
import { UserSkillService } from 'modules/user-skill/user-skill.service';

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

    private readonly userSkillService: UserSkillService,
  ) {}

  async verifyEvidence(
    id: string,
    updateData: VerifyEvidenceDto,
    requester: IUser,
  ) {
    if (requester.role?.name?.toUpperCase() !== 'PM') {
      throw new ForbiddenException('Only project managers can verify evidence');
    }

    const evidence = await this.evidenceRepo.findOne({
      where: { id },
      relations: {
        userSkill: true,
      },
    });

    if (!evidence) {
      throw new NotFoundException('Không tìm thấy Bằng chứng này');
    }

    const managedDeveloper = await this.userSkillRepo.manager
      .getRepository(User)
      .findOne({
        where: {
          id: evidence.userSkill.userId,
          managerId: requester.id,
          isDeleted: false,
        },
        select: {
          id: true,
        },
      });

    if (!managedDeveloper) {
      throw new ForbiddenException(
        'You can only verify evidence for developers you manage',
      );
    }

    const rejectReason = updateData.rejectReason?.trim();
    if (updateData.status === 'REJECTED' && !rejectReason) {
      throw new BadRequestException('Reject reason is required');
    }

    evidence.status = updateData.status;
    evidence.rejectReason =
      updateData.status === 'REJECTED' ? rejectReason! : null;
    evidence.updatedBy = {
      id: requester.id,
      email: requester.email,
    };

    await this.evidenceRepo.save(evidence);
    await this.userSkillService.recalculateUserSkill(evidence.userSkill.id);

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
