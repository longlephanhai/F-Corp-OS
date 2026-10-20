import { ReviewCycleStatus, ReviewRecordStatus } from 'common/enum/hr-review.enum';
import { EntityManager } from 'typeorm';
import { ReviewCycle } from './entities/review-cycle.entity';
import { ReviewRecord } from './entities/review-record.entity';
import {
  mapPmRatingsToTempScore,
  PmReleaseReviewService,
  PROJECT_RELEASE_CYCLE_ID,
} from './pm-release-review.service';

describe('PmReleaseReviewService', () => {
  it('maps two 1..5 PM ratings linearly onto the existing 0..100 score scale', () => {
    expect(mapPmRatingsToTempScore(5, 4)).toBe(90);
    expect(mapPmRatingsToTempScore(1, 1)).toBe(20);
  });

  it('returns the existing source record without creating a duplicate', async () => {
    const existing = { id: 'review-1' } as ReviewRecord;
    const recordRepository = {
      findOne: jest.fn().mockResolvedValue(existing),
      create: jest.fn(),
      save: jest.fn(),
    };
    const manager = {
      getRepository: jest.fn().mockReturnValue(recordRepository),
    } as unknown as EntityManager;
    const service = new PmReleaseReviewService();

    const result = await service.ensureReviewRecord(
      manager,
      {
        id: 'allocation-1',
        userId: 'developer-1',
        hardSkillRate: 5,
        softSkillRate: 4,
        reviewComment: 'Strong delivery',
      },
      { id: 'pm-1', email: 'pm@example.com' } as any,
    );

    expect(result).toBe(existing);
    expect(recordRepository.create).not.toHaveBeenCalled();
    expect(recordRepository.save).not.toHaveBeenCalled();
  });

  it('creates one pending record using the deterministic fallback cycle', async () => {
    const fallbackCycle = {
      id: PROJECT_RELEASE_CYCLE_ID,
      status: ReviewCycleStatus.ACTIVE,
    } as ReviewCycle;
    const recordRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    const cycleRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(fallbackCycle),
    };
    const manager = {
      getRepository: jest.fn((entity) =>
        entity === ReviewRecord ? recordRepository : cycleRepository,
      ),
    } as unknown as EntityManager;
    const service = new PmReleaseReviewService();

    const result = await service.ensureReviewRecord(
      manager,
      {
        id: 'allocation-1',
        userId: 'developer-1',
        hardSkillRate: 5,
        softSkillRate: 4,
        reviewComment: 'Strong delivery',
      },
      { id: 'pm-1', email: 'pm@example.com' } as any,
    );

    expect(result).toEqual(
      expect.objectContaining({
        status: ReviewRecordStatus.PENDING,
        tempScore: 90,
        finalScore: null,
        reviewerNote: 'Strong delivery',
        sourceUserSprintId: 'allocation-1',
        reviewCycle: fallbackCycle,
      }),
    );
    expect(recordRepository.save).toHaveBeenCalledTimes(1);
  });
});
