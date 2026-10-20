import { BadRequestException } from '@nestjs/common';
import { ReviewRecordStatus } from 'common/enum/hr-review.enum';
import { DataSource } from 'typeorm';
import { HrReviewsService } from './hr-reviews.service';
import { ReviewRecord } from './entities/review-record.entity';

describe('HrReviewsService review workflow', () => {
  const hrUser = { id: 'hr-1', email: 'hr@example.com' } as any;

  function createHarness(record: ReviewRecord) {
    const recordRepository = {
      findOne: jest.fn().mockImplementation(async () => record),
      save: jest.fn().mockImplementation(async (value) => value),
    };
    const manager = {
      getRepository: jest.fn().mockReturnValue(recordRepository),
    };
    const dataSource = {
      transaction: jest.fn(async (operation) => operation(manager)),
    } as unknown as DataSource;
    const walletService = {
      processRewardWithManager: jest.fn().mockResolvedValue(undefined),
    };
    const rewardRuleService = {
      calculateScoreReward: jest.fn((score: number) =>
        score >= 90 ? 1000 : score >= 80 ? 500 : score >= 70 ? 200 : 0,
      ),
    };
    const service = new HrReviewsService(
      {} as any,
      {} as any,
      {} as any,
      dataSource,
      rewardRuleService as any,
      walletService as any,
    );

    return { service, recordRepository, walletService };
  }

  function reviewRecord(overrides: Partial<ReviewRecord> = {}): ReviewRecord {
    return {
      id: 'review-1',
      status: ReviewRecordStatus.IN_REVIEW,
      tempScore: 90,
      finalScore: 90,
      employee: { id: 'developer-1' },
      isDeleted: false,
      ...overrides,
    } as ReviewRecord;
  }

  it('rejects a transition that skips PENDING -> IN_REVIEW', async () => {
    const { service } = createHarness(
      reviewRecord({ status: ReviewRecordStatus.PENDING }),
    );

    await expect(
      service.updateRecordStatus(
        'review-1',
        { status: ReviewRecordStatus.COMPLETED },
        hrUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each([
    ['tempScore', null, 90],
    ['finalScore', 90, null],
  ])('requires a valid %s before completion', async (_field, tempScore, finalScore) => {
    const { service } = createHarness(reviewRecord({ tempScore, finalScore }));

    await expect(
      service.updateRecordStatus(
        'review-1',
        { status: ReviewRecordStatus.COMPLETED },
        hrUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rewards a qualifying completion once across an idempotent retry', async () => {
    const record = reviewRecord();
    const { service, walletService } = createHarness(record);

    await service.updateRecordStatus(
      'review-1',
      { status: ReviewRecordStatus.COMPLETED },
      hrUser,
    );
    await service.updateRecordStatus(
      'review-1',
      { status: ReviewRecordStatus.COMPLETED },
      hrUser,
    );

    expect(record.status).toBe(ReviewRecordStatus.COMPLETED);
    expect(walletService.processRewardWithManager).toHaveBeenCalledTimes(1);
    expect(walletService.processRewardWithManager).toHaveBeenCalledWith(
      'developer-1',
      1000,
      'review-1',
      expect.anything(),
      'hr-1',
    );
  });

  it('completes a below-threshold review without a wallet transaction', async () => {
    const record = reviewRecord({ finalScore: 69 });
    const { service, walletService } = createHarness(record);

    await service.updateRecordStatus(
      'review-1',
      { status: ReviewRecordStatus.COMPLETED },
      hrUser,
    );

    expect(record.status).toBe(ReviewRecordStatus.COMPLETED);
    expect(walletService.processRewardWithManager).not.toHaveBeenCalled();
  });

  it('does not let HR overwrite a PM release source score or note', async () => {
    const record = reviewRecord({ sourceUserSprintId: 'allocation-1' });
    const { service } = createHarness(record);

    await expect(
      service.updateRecordScore(
        'review-1',
        { tempScore: 50, reviewerNote: 'replacement' },
        hrUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
