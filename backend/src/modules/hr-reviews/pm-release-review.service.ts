import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ReviewCycleStatus, ReviewRecordStatus } from 'common/enum/hr-review.enum';
import type { IUser } from 'common/types/user.interface';
import { UserSprint } from 'modules/user-sprints/entities/user-sprint.entity';
import {
  EntityManager,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
} from 'typeorm';
import { ReviewCycle } from './entities/review-cycle.entity';
import { ReviewRecord } from './entities/review-record.entity';

export const PROJECT_RELEASE_CYCLE_ID =
  '00000000-0000-4000-8000-000000000001';
export const PROJECT_RELEASE_CYCLE_NAME = 'Project Release Reviews';

export function mapPmRatingsToTempScore(
  hardSkillRate: number,
  softSkillRate: number,
): number {
  return Math.round(((hardSkillRate + softSkillRate) / 2) * 20);
}

type ReleaseReviewSource = Pick<
  UserSprint,
  | 'id'
  | 'userId'
  | 'hardSkillRate'
  | 'softSkillRate'
  | 'reviewComment'
>;

@Injectable()
export class PmReleaseReviewService {
  async ensureReviewRecord(
    manager: EntityManager,
    source: ReleaseReviewSource,
    actor: IUser,
    releaseDate = new Date(),
  ): Promise<ReviewRecord> {
    const recordRepository = manager.getRepository(ReviewRecord);
    const existing = await recordRepository.findOne({
      where: {
        sourceUserSprintId: source.id,
        isDeleted: false,
      },
    });

    if (existing) {
      return existing;
    }

    const reviewCycle = await this.resolveReviewCycle(manager, releaseDate);
    const auditUser = {
      id: actor?.id ?? '',
      email: actor?.email ?? '',
    };
    const reviewRecord = recordRepository.create({
      status: ReviewRecordStatus.PENDING,
      tempScore: mapPmRatingsToTempScore(
        Number(source.hardSkillRate),
        Number(source.softSkillRate),
      ),
      finalScore: null,
      reviewerNote: source.reviewComment,
      sourceUserSprintId: source.id,
      sourceUserSprint: { id: source.id } as UserSprint,
      employee: { id: source.userId } as any,
      reviewCycle,
      createdBy: auditUser,
      updatedBy: auditUser,
    });

    return recordRepository.save(reviewRecord);
  }

  private async resolveReviewCycle(
    manager: EntityManager,
    releaseDate: Date,
  ): Promise<ReviewCycle> {
    const cycleRepository = manager.getRepository(ReviewCycle);
    const manualActiveCycles = await cycleRepository.find({
      where: {
        id: Not(PROJECT_RELEASE_CYCLE_ID),
        status: ReviewCycleStatus.ACTIVE,
        startDate: LessThanOrEqual(releaseDate),
        endDate: MoreThanOrEqual(releaseDate),
        isDeleted: false,
      },
      order: {
        createdAt: 'ASC',
      },
      take: 2,
    });

    if (manualActiveCycles.length === 1) {
      return manualActiveCycles[0];
    }

    const fallbackCycle = await cycleRepository.findOne({
      where: {
        id: PROJECT_RELEASE_CYCLE_ID,
        isDeleted: false,
      },
    });

    if (!fallbackCycle) {
      throw new InternalServerErrorException(
        'Thiếu Project Release review cycle. Hãy chạy database migrations.',
      );
    }

    return fallbackCycle;
  }
}
