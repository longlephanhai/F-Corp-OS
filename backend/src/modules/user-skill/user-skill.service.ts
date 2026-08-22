import { BadRequestException, Injectable } from '@nestjs/common';
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
    this.server.emit('user-skill-updated', {
      message: `User ${user.fullName} has added a new skill...`,
    });
    return await this.recalculateUserSkill(savedUserSkill.id);
  }

  findAll() {
    return `This action returns all userSkill`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userSkill`;
  }

  update(id: number, updateUserSkillDto: UpdateUserSkillDto) {
    return `This action updates a #${id} userSkill`;
  }

  remove(id: number) {
    return `This action removes a #${id} userSkill`;
  }
}
