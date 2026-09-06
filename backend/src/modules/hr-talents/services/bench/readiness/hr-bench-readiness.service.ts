import { Injectable } from '@nestjs/common';

import { GetHrBenchReadinessDto } from '../../../dto/get-hr-bench-readiness.dto';

import { HrBenchTalentPoolService } from '../hr-bench-talent-pool.service';

import {
    scoreBenchReadiness,
} from './hr-bench-readiness.scorer';

@Injectable()
export class HrBenchReadinessService {
    constructor(
        private readonly benchTalentPoolService:
            HrBenchTalentPoolService,
    ) { }

    async findAll(
        query: GetHrBenchReadinessDto,
    ) {
        const {
            staleDays = 90,
        } = query;

        /*
         * Tái sử dụng Bench Talent Pool.
         *
         * Service này KHÔNG query lại:
         * - User
         * - UserSkill
         * - SkillEvidence
         * - ReviewRecord
         *
         * Bench Pool đã tổng hợp đầy đủ
         * dữ liệu Talent cần thiết.
         */
        const benchPage =
            await this.benchTalentPoolService
                .findAll(query);

        /*
         * Chỉ bổ sung lớp đánh giá
         * mức độ sẵn sàng.
         */
        const result =
            benchPage.result.map(
                (talent) => ({
                    ...talent,

                    readiness:
                        scoreBenchReadiness(
                            talent,
                            staleDays,
                        ),
                }),
            );

        return {
            criteria: {
                ...benchPage.criteria,

                /*
                 * Ngưỡng để xác định
                 * hồ sơ năng lực đã cũ.
                 */
                staleDays:
                    Number(staleDays),
            },

            meta:
                benchPage.meta,

            result,
        };
    }

    async getSummary(
        staleDays = 90,
    ) {
        const talents =
            await this.benchTalentPoolService
                .findAllForSummary();

        const readinessResults =
            talents.map(
                (talent) =>
                    scoreBenchReadiness(
                        talent,
                        staleDays,
                    ),
            );

        const ready =
            readinessResults.filter(
                (item) =>
                    item.status === 'READY',
            ).length;

        const partiallyReady =
            readinessResults.filter(
                (item) =>
                    item.status ===
                    'PARTIALLY_READY',
            ).length;

        const needsVerification =
            readinessResults.filter(
                (item) =>
                    item.status ===
                    'NEEDS_VERIFICATION',
            ).length;

        const needsProfileUpdate =
            readinessResults.filter(
                (item) =>
                    item.status ===
                    'NEEDS_PROFILE_UPDATE',
            ).length;

        return {
            totalBench:
                readinessResults.length,

            ready,

            partiallyReady,

            needsVerification,

            needsProfileUpdate,
        };
    }
}