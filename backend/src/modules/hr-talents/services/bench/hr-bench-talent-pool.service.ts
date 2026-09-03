import { Injectable } from '@nestjs/common';

import { UserStatusType } from 'common/enum/user.enum';

import { GetHrBenchTalentsDto } from '../../dto/get-hr-bench-talents.dto';
import { HrBenchPerformanceService } from './hr-bench-performance.service';
import { HrBenchTalentQueryService } from './hr-bench-talent-query.service';

import { mapBenchTalent } from './hr-bench-talent.mapper';

@Injectable()
export class HrBenchTalentPoolService {
  constructor(
    private readonly benchTalentQueryService:
      HrBenchTalentQueryService,

    private readonly benchPerformanceService:
      HrBenchPerformanceService,
  ) {}

  async findAll(
    query: GetHrBenchTalentsDto,
  ) {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      skillId,
      minLevel,
      verified,
    } = query;

    /*
     * Query Bench employees + Talent data.
     */
    const {
      users,
      total,
    } =
      await this.benchTalentQueryService
        .findPage(query);

    /*
     * Batch-load Performance.
     *
     * Không query từng employee.
     */
    const employeeIds =
      users.map(
        (user) =>
          user.id,
      );

    const latestReviewByEmployeeId =
      await this.benchPerformanceService
        .getLatestCompletedReviewMap(
          employeeIds,
        );

    /*
     * Pure mapping:
     * User + Review
     * → Bench Talent response.
     */
    const result =
      users.map(
        (user) =>
          mapBenchTalent(
            user,
            latestReviewByEmployeeId.get(
              user.id,
            ) ?? null,
          ),
      );

    return {
      criteria: {
        status:
          UserStatusType.BENCH,

        search:
          search?.trim() ||
          null,

        role:
          role?.trim() ||
          null,

        skillId:
          skillId ??
          null,

        minLevel:
          minLevel ??
          null,

        /*
         * false nghĩa là không enforce
         * verified-only.
         */
        verified:
          verified === true,
      },

      meta: {
        currentPage:
          Number(page),

        pageSize:
          Number(limit),

        pages:
          total === 0
            ? 0
            : Math.ceil(
                total /
                  limit,
              ),

        total,
      },

      result,
    };
  }
}