import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserSkillDto } from './dto/create-user-skill.dto';
import { UpdateUserSkillDto } from './dto/update-user-skill.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserSkill } from './entities/user-skill.entity';
import { Repository } from 'typeorm';
import { IUser } from 'common/types/user.interface';
import { SkillEvidence } from 'modules/skill-evidences/entities/skill-evidence.entity';
import { EVIDENCE_WEIGHTS, STATUS_FACTORS } from './constants/skill-weight.constant';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { generatedRoomUserId } from 'helper';

@WebSocketGateway({ namespace: '/user-skills' })
@Injectable()
export class UserSkillService {
  @WebSocketServer()
  server: Server;
  constructor(
    @InjectRepository(UserSkill) private userSkillsRepository: Repository<UserSkill>,
    @InjectRepository(SkillEvidence) private skillEvidencesRepository: Repository<SkillEvidence>,
  ) { }

  private getYearsScore(years: number): number {
    if (years < 1) return 1;
    if (years < 2) return 2;
    if (years < 4) return 3;
    if (years < 6) return 4;
    return 5;
  }

  private getEvidenceScore(score: number): number {
    if (score < 0.3) return 1;
    if (score < 0.6) return 2;
    if (score < 0.9) return 3;
    if (score < 1.2) return 4;
    return 5;
  }

  async recalculateUserSkill(userSkillId: string) {
    const userSkill = await this.userSkillsRepository.findOne({
      where: { id: userSkillId, isDeleted: false },
      relations: {
        evidences: true,
      }
    })
    if (!userSkill) {
      throw new BadRequestException(`UserSkill with id ${userSkillId} not found`);
    }
    const activeEvidences = userSkill.evidences?.filter((ev) => !ev.isDeleted) || [];

    let totalConfidence = 0;
    let approvedEvidenceScore = 0;
    for (const ev of activeEvidences) {
      const weight = EVIDENCE_WEIGHTS[ev.type] || 0;
      const factor = STATUS_FACTORS[ev.status] ?? 0.0;

      totalConfidence += weight * factor;
      if (ev.status === 'APPROVED') {
        approvedEvidenceScore += weight;
      }
    }

    const confidenceScore = Math.min(1.0, Math.round(totalConfidence * 100) / 100);
    const yearsScore = this.getYearsScore(userSkill.years || 0);
    const evidenceScore = this.getEvidenceScore(approvedEvidenceScore);

    const rawLevel = (yearsScore * 0.6) + (evidenceScore * 0.4);

    const calculatedLevel = Math.max(1, Math.min(5, Math.round(rawLevel)));

    userSkill.confidenceScore = confidenceScore;
    userSkill.level = calculatedLevel;

    return await this.userSkillsRepository.save(userSkill);

  }

  async create(createUserSkillDto: CreateUserSkillDto, user: IUser) {

    const isExist = await this.userSkillsRepository.findOne({
      where: {
        userId: user.id,
        skillId: createUserSkillDto.skillId,
      }
    })

    if (isExist) {
      throw new BadRequestException('User skill already exists');
    }

    const userSikll = this.userSkillsRepository.create({
      userId: user.id,
      skillId: createUserSkillDto.skillId,
      description: createUserSkillDto.description,
      evidenceNote: createUserSkillDto.evidenceNotes,
      years: createUserSkillDto.years,
      createdBy: {
        id: user.id,
        email: user.email
      },
    })

    const savedUserSkill = await this.userSkillsRepository.save(userSikll);

    if (createUserSkillDto.evidences && createUserSkillDto.evidences.length > 0) {
      const evidencesToSave = createUserSkillDto.evidences.map(evidence => {
        return this.skillEvidencesRepository.create({
          userSkillId: savedUserSkill.id,
          type: evidence.type,
          title: evidence.title,
          url: evidence.url,
          description: evidence.description,
          status: 'PENDING',
          createdBy: {
            id: user.id,
            email: user.email
          },
        });
      });

      await this.skillEvidencesRepository.save(evidencesToSave);
    }
    // this.server.to(generatedRoomUserId(user.id)).emit('user-skill-updated', {
    //   message: `User ${user.fullName} has added a new skill with evidence: ${createUserSkillDto.description}`,
    // });
    // this.server.emit('user-skill-updated', {
    //   message: `User ${user.fullName} has added a new skill...`,
    // });
    if (user?.managerId) {
      this.server?.to(generatedRoomUserId(user.managerId)).emit('user-skill-updated', {
        message: `User ${user.fullName} has added a new skill with evidence: ${createUserSkillDto.description}`,
      });
    }
    return await this.recalculateUserSkill(savedUserSkill.id);
  }

  async getSkillTree(user: IUser) {
    // 1. Lấy toàn bộ skills trong hệ thống
    const allSkills = await this.userSkillsRepository.manager
      .getRepository('skills')
      .createQueryBuilder('skill')
      .where('skill.isDeleted = false')
      .getMany();

    // 2. Lấy user_skills của user hiện tại (XP + level)
    const userSkills = await this.userSkillsRepository.find({
      where: { userId: user.id, isDeleted: false },
    });

    // Map user_skills theo skillId để lookup nhanh
    const userSkillMap = new Map(userSkills.map((us) => [us.skillId, us]));

    const childrenByParent = new Map<string, string[]>();
    allSkills.forEach((skill: any) => {
      if (!skill.parentId) return;
      const parentChildren = childrenByParent.get(skill.parentId) ?? [];
      parentChildren.push(skill.id);
      childrenByParent.set(skill.parentId, parentChildren);
    });

    const visited = new Set<string>();
    const getEffectiveSkillState = (skillId: string): { level: number; xp: number } => {
      if (visited.has(skillId)) {
        return { level: 0, xp: 0 };
      }

      visited.add(skillId);

      const directUserSkill = userSkillMap.get(skillId);
      const directLevel = directUserSkill?.level ?? 0;
      const directXp = directUserSkill?.currentXp ?? 0;
      const children = childrenByParent.get(skillId) ?? [];

      let maxChildLevel = 0;
      let maxChildXp = 0;

      for (const childId of children) {
        const childState = getEffectiveSkillState(childId);
        maxChildLevel = Math.max(maxChildLevel, childState.level);
        maxChildXp = Math.max(maxChildXp, childState.xp);
      }

      visited.delete(skillId);

      return {
        level: Math.max(directLevel, maxChildLevel),
        xp: Math.max(directXp, maxChildXp),
      };
    };

    // 3. Transform thành định dạng node cho frontend
    const nodes = allSkills.map((skill: any) => {
      const effectiveState = getEffectiveSkillState(skill.id);

      return {
        id: skill.id,
        parentId: skill.parentId ?? null,
        name: skill.name,
        description: skill.description,
        level: effectiveState.level,
        currentXp: effectiveState.xp,
        userSkillId: userSkillMap.get(skill.id)?.id ?? null,
      };
    });

    return nodes;
  }

  findAll(user: IUser) {
    return this.userSkillsRepository.find({
      where: { userId: user.id, isDeleted: false },
      relations: {
        skill: true,
        evidences: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: IUser) {
    const userSkill = await this.userSkillsRepository.findOne({
      where: { id, userId: user.id, isDeleted: false },
      relations: {
        skill: true,
        evidences: true,
      },
    });

    if (!userSkill) {
      throw new NotFoundException(`UserSkill with id "${id}" not found`);
    }

    return userSkill;
  }

  async update(
    id: string,
    updateUserSkillDto: UpdateUserSkillDto,
    user: IUser,
  ) {
    const userSkill = await this.findOne(id, user);

    if (
      updateUserSkillDto.skillId &&
      updateUserSkillDto.skillId !== userSkill.skillId
    ) {
      const duplicate = await this.userSkillsRepository.findOne({
        where: {
          userId: user.id,
          skillId: updateUserSkillDto.skillId,
          isDeleted: false,
        },
      });

      if (duplicate) {
        throw new BadRequestException('User skill already exists');
      }

      userSkill.skillId = updateUserSkillDto.skillId;
    }

    if (updateUserSkillDto.description !== undefined) {
      userSkill.description = updateUserSkillDto.description;
    }
    if (updateUserSkillDto.years !== undefined) {
      userSkill.years = updateUserSkillDto.years;
    }
    if (updateUserSkillDto.evidenceNotes !== undefined) {
      userSkill.evidenceNote = updateUserSkillDto.evidenceNotes;
    }

    userSkill.updatedBy = { id: user.id, email: user.email };
    await this.userSkillsRepository.save(userSkill);

    return this.recalculateUserSkill(userSkill.id);
  }

  async remove(id: string, user: IUser) {
    const userSkill = await this.findOne(id, user);

    userSkill.isDeleted = true;
    userSkill.deletedBy = { id: user.id, email: user.email };
    await this.userSkillsRepository.save(userSkill);
    await this.userSkillsRepository.softDelete(userSkill.id);

    return { message: `UserSkill "${id}" deleted successfully` };
  }
}
