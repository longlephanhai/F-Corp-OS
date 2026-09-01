export type BenchReadinessStatus =
    | 'READY'
    | 'PARTIALLY_READY'
    | 'NEEDS_VERIFICATION'
    | 'NEEDS_PROFILE_UPDATE';

interface BenchReadinessSkill {
    level: number;
}

interface BenchReadinessInput {
    skillSummary: {
        totalSkills: number;
        skillsWithApprovedEvidence: number;
        evidenceCoverageRate: number;
    };

    topSkills: BenchReadinessSkill[];

    performance: {
        latestFinalScore: number | null;
    };

    lastTalentDataUpdatedAt:
    | Date
    | string
    | null;
}

export interface BenchReadinessResult {
    score: number;

    status: BenchReadinessStatus;

    components: {
        skill: {
            score: number;
            maxScore: 35;
            skillCount: number;
            averageTopLevel: number;
        };

        evidence: {
            score: number;
            maxScore: 30;
            coverageRate: number;
        };

        performance: {
            score: number;
            maxScore: 20;
            latestFinalScore: number | null;
            hasCompletedReview: boolean;
        };

        freshness: {
            score: number;
            maxScore: 15;
            daysSinceUpdate: number | null;
            isStale: boolean;
        };
    };

    strengths: string[];

    issues: string[];
}

const roundOne = (
    value: number,
): number =>
    Number(value.toFixed(1));

function calculateDaysSinceUpdate(
    value:
        | Date
        | string
        | null,
): number | null {
    if (!value) {
        return null;
    }

    const date =
        value instanceof Date
            ? value
            : new Date(value);

    const timestamp =
        date.getTime();

    if (
        !Number.isFinite(
            timestamp,
        )
    ) {
        return null;
    }

    const millisecondsPerDay =
        24 *
        60 *
        60 *
        1000;

    const difference =
        Date.now() -
        timestamp;

    return Math.max(
        0,
        Math.floor(
            difference /
            millisecondsPerDay,
        ),
    );
}

function calculateSkillComponent(
    input: BenchReadinessInput,
) {
    const totalSkills =
        input.skillSummary
            .totalSkills;

    const topThreeLevels =
        input.topSkills
            .slice(0, 3)
            .map((skill) =>
                Number(skill.level),
            )
            .filter(
                (level) =>
                    Number.isFinite(level),
            );

    const averageTopLevel =
        topThreeLevels.length === 0
            ? 0
            : topThreeLevels.reduce(
                (
                    total,
                    level,
                ) =>
                    total +
                    level,
                0,
            ) /
            topThreeLevels.length;

    /*
     * Skill quality:
     * 25 điểm.
     *
     * Level tối đa = 5.
     */
    const levelScore =
        Math.min(
            averageTopLevel,
            5,
        ) /
        5 *
        25;

    /*
     * Skill breadth:
     * 10 điểm.
     *
     * Có từ 3 skills trở lên
     * được full breadth score.
     */
    const breadthScore =
        Math.min(
            totalSkills,
            3,
        ) /
        3 *
        10;

    return {
        score:
            roundOne(
                levelScore +
                breadthScore,
            ),

        maxScore:
            35 as const,

        skillCount:
            totalSkills,

        averageTopLevel:
            roundOne(
                averageTopLevel,
            ),
    };
}

function calculateEvidenceComponent(
    input: BenchReadinessInput,
) {
    const coverageRate =
        Math.min(
            Math.max(
                Number(
                    input.skillSummary
                        .evidenceCoverageRate ??
                    0,
                ),
                0,
            ),
            100,
        );

    return {
        score:
            roundOne(
                coverageRate /
                100 *
                30,
            ),

        maxScore:
            30 as const,

        coverageRate:
            roundOne(
                coverageRate,
            ),
    };
}

function calculatePerformanceComponent(
    input: BenchReadinessInput,
) {
    const latestFinalScore =
        input.performance
            .latestFinalScore;

    const hasCompletedReview =
        latestFinalScore !== null &&
        latestFinalScore !== undefined &&
        Number.isFinite(
            Number(
                latestFinalScore,
            ),
        );

    if (
        !hasCompletedReview
    ) {
        return {
            score: 0,

            maxScore:
                20 as const,

            latestFinalScore:
                null,

            hasCompletedReview:
                false,
        };
    }

    const normalizedScore =
        Math.min(
            Math.max(
                Number(
                    latestFinalScore,
                ),
                0,
            ),
            100,
        );

    return {
        score:
            roundOne(
                normalizedScore /
                100 *
                20,
            ),

        maxScore:
            20 as const,

        latestFinalScore:
            Number(
                latestFinalScore,
            ),

        hasCompletedReview:
            true,
    };
}

function calculateFreshnessComponent(
    input: BenchReadinessInput,
    staleDays: number,
) {
    const daysSinceUpdate =
        calculateDaysSinceUpdate(
            input.lastTalentDataUpdatedAt,
        );

    const isStale =
        daysSinceUpdate === null ||
        daysSinceUpdate >
        staleDays;

    let score = 0;

    if (
        daysSinceUpdate !== null
    ) {
        if (
            daysSinceUpdate <= 30
        ) {
            score = 15;
        } else if (
            daysSinceUpdate <= 60
        ) {
            score = 12;
        } else if (
            daysSinceUpdate <=
            staleDays
        ) {
            score = 8;
        }
    }

    return {
        score,

        maxScore:
            15 as const,

        daysSinceUpdate,

        isStale,
    };
}

function determineStatus(
    input: BenchReadinessInput,
    score: number,
    isStale: boolean,
): BenchReadinessStatus {
    /*
     * Hard gate #1:
     * Không có skill thì Talent Profile
     * chưa đủ dữ liệu để đánh giá.
     */
    if (
        input.skillSummary
            .totalSkills === 0
    ) {
        return 'NEEDS_PROFILE_UPDATE';
    }

    /*
     * Hard gate #2:
     * Có skill nhưng chưa có bất kỳ
     * skill nào được evidence xác minh.
     */
    if (
        input.skillSummary
            .skillsWithApprovedEvidence ===
        0
    ) {
        return 'NEEDS_VERIFICATION';
    }

    /*
     * Hard gate #3:
     * Talent Profile quá cũ.
     */
    if (isStale) {
        return 'NEEDS_PROFILE_UPDATE';
    }

    /*
     * Khi qua các hard gates,
     * score mới quyết định readiness.
     */
    if (score >= 80) {
        return 'READY';
    }

    return 'PARTIALLY_READY';
}

function buildStrengths(
    input: BenchReadinessInput,
): string[] {
    const strengths: string[] =
        [];

    if (
        input.skillSummary
            .totalSkills > 0
    ) {
        strengths.push(
            `Có ${input.skillSummary.totalSkills} kỹ năng trong hồ sơ`,
        );
    }

    if (
        input.skillSummary
            .skillsWithApprovedEvidence >
        0
    ) {
        strengths.push(
            `${input.skillSummary.skillsWithApprovedEvidence}/${input.skillSummary.totalSkills} kỹ năng có minh chứng được duyệt`,
        );
    }

    if (
        input.performance
            .latestFinalScore !== null
    ) {
        strengths.push(
            `Hiệu suất gần nhất ${input.performance.latestFinalScore}`,
        );
    }

    return strengths;
}

function buildIssues(
    input: BenchReadinessInput,
    isStale: boolean,
): string[] {
    const issues: string[] =
        [];

    if (
        input.skillSummary
            .totalSkills === 0
    ) {
        issues.push(
            'Chưa có kỹ năng trong hồ sơ năng lực',
        );
    } else {
        const unverifiedSkills =
            Math.max(
                0,
                input.skillSummary
                    .totalSkills -
                input.skillSummary
                    .skillsWithApprovedEvidence,
            );

        if (
            unverifiedSkills >
            0
        ) {
            issues.push(
                `${unverifiedSkills} kỹ năng chưa có minh chứng được duyệt`,
            );
        }
    }

    if (
        input.performance
            .latestFinalScore === null
    ) {
        issues.push(
            'Chưa có đánh giá hiệu suất hoàn tất',
        );
    }

    if (isStale) {
        issues.push(
            'Hồ sơ năng lực đã quá thời hạn cập nhật',
        );
    }

    return issues;
}

export function scoreBenchReadiness(
    input: BenchReadinessInput,
    staleDays = 90,
): BenchReadinessResult {
    const skill =
        calculateSkillComponent(
            input,
        );

    const evidence =
        calculateEvidenceComponent(
            input,
        );

    const performance =
        calculatePerformanceComponent(
            input,
        );

    const freshness =
        calculateFreshnessComponent(
            input,
            staleDays,
        );

    const score =
        roundOne(
            skill.score +
            evidence.score +
            performance.score +
            freshness.score,
        );

    const status =
        determineStatus(
            input,
            score,
            freshness.isStale,
        );

    return {
        score,

        status,

        components: {
            skill,
            evidence,
            performance,
            freshness,
        },

        strengths:
            buildStrengths(
                input,
            ),

        issues:
            buildIssues(
                input,
                freshness.isStale,
            ),
    };
}