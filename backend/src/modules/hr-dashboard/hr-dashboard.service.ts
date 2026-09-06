import { Injectable } from '@nestjs/common';

import { HrReviewsService } from '../hr-reviews/hr-reviews.service';
import { HrTalentsService } from '../hr-talents/hr-talents.service';
import { HrWalletsService } from '../hr-wallets/hr-wallets.service';

import type {
    HrDashboardSummary,
} from './hr-dashboard.types';

@Injectable()
export class HrDashboardService {
    constructor(
        private readonly hrTalentsService:
            HrTalentsService,

        private readonly hrReviewsService:
            HrReviewsService,

        private readonly hrWalletsService:
            HrWalletsService,
    ) { }

    async getSummary(): Promise<HrDashboardSummary> {
        const [
            workforce,
            reviews,
            skillSupply,
            benchReadiness,
            dataQuality,
            wallet,
        ] = await Promise.all([
            this.hrTalentsService
                .getWorkforceSummary(),

            this.hrReviewsService
                .getRecordStats(),

            this.hrTalentsService
                .getSkillSupplySummary(),

            this.hrTalentsService
                .getBenchReadinessSummary(),

            this.hrTalentsService
                .getTalentDataQuality({
                    staleDays: 90,
                }),

            this.hrWalletsService
                .getDashboardStats(),
        ]);

        const completionRate =
            reviews.total === 0
                ? 0
                : Number(
                    (
                        (
                            reviews.completed /
                            reviews.total
                        ) *
                        100
                    ).toFixed(1),
                );

        return {
            workforce,

            reviews: {
                ...reviews,
                completionRate,
            },

            skillSupply: {
                totalSkills:
                    skillSupply.catalog.totalSkills,

                skillsWithSupply:
                    skillSupply.catalog.skillsWithSupply,

                zeroSupplySkills:
                    skillSupply.catalog.zeroSupplySkills,

                verificationRate:
                    skillSupply.coverage.verificationRate,

                topSupplySkills:
                    skillSupply.topSupplySkills,

                topBenchSkills:
                    skillSupply.topBenchSkills,
            },

            benchReadiness,

            dataQuality: {
                employeesWithoutSkills:
                    dataQuality.summary
                        .employeesWithoutSkills,

                employeesWithoutApprovedEvidence:
                    dataQuality.summary
                        .employeesWithoutApprovedEvidence,

                employeesWithPendingEvidence:
                    dataQuality.summary
                        .employeesWithPendingEvidence,

                totalPendingEvidences:
                    dataQuality.summary
                        .totalPendingEvidences,

                staleProfiles:
                    dataQuality.summary
                        .staleProfiles,
            },

            wallet,
        };
    }
}