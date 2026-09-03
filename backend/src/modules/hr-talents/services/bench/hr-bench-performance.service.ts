import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ReviewRecordStatus } from 'common/enum/hr-review.enum';
import { ReviewRecord } from 'modules/hr-reviews/entities/review-record.entity';

import {
    In,
    Repository,
} from 'typeorm';

@Injectable()
export class HrBenchPerformanceService {
    constructor(
        @InjectRepository(ReviewRecord)
        private readonly reviewRecordRepository:
            Repository<ReviewRecord>,
    ) { }

    async getLatestCompletedReviewMap(
        employeeIds: string[],
    ): Promise<Map<string, ReviewRecord>> {
        const result =
            new Map<string, ReviewRecord>();

        if (employeeIds.length === 0) {
            return result;
        }

        const reviewRecords =
            await this.reviewRecordRepository.find({
                where: {
                    employee: {
                        id: In(employeeIds),
                    },

                    status:
                        ReviewRecordStatus.COMPLETED,

                    isDeleted:
                        false,
                },

                relations: {
                    employee: true,
                    reviewCycle: true,
                },

                order: {
                    createdAt: 'DESC',
                },
            });

        /*
         * Array đã sort createdAt DESC.
         *
         * Record đầu tiên của mỗi employee
         * có finalScore hợp lệ sẽ được xem là
         * latest completed review.
         */
        for (const review of reviewRecords) {
            if (
                review.finalScore === null ||
                review.finalScore === undefined
            ) {
                continue;
            }

            const employeeId =
                review.employee?.id;

            if (
                !employeeId ||
                result.has(employeeId)
            ) {
                continue;
            }

            result.set(
                employeeId,
                review,
            );
        }

        return result;
    }
}