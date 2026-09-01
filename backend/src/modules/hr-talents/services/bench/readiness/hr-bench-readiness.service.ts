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
}