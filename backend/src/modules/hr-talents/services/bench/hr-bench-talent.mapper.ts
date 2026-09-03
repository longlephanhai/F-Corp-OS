import { ReviewRecord } from 'modules/hr-reviews/entities/review-record.entity';
import { User } from 'modules/users/entities/user.entity';

export function mapBenchTalent(
    user: User,
    latestReview: ReviewRecord | null,
) {
    const userSkills = (user.userSkills ?? []).filter(
        (userSkill) => Boolean(userSkill.skill),
    );

    const evidenceList = userSkills.flatMap(
        (userSkill) => userSkill.evidences ?? [],
    );

    const approvedEvidences = evidenceList.filter(
        (evidence) => evidence.status === 'APPROVED',
    );

    const pendingEvidences = evidenceList.filter(
        (evidence) => evidence.status === 'PENDING',
    );

    const rejectedEvidences = evidenceList.filter(
        (evidence) => evidence.status === 'REJECTED',
    );

    const skillsWithApprovedEvidence = userSkills.filter(
        (userSkill) =>
            (userSkill.evidences ?? []).some(
                (evidence) => evidence.status === 'APPROVED',
            ),
    ).length;

    const topSkills = [...userSkills]
        .sort((left, right) => {
            const levelDifference =
                Number(right.level ?? 0) -
                Number(left.level ?? 0);

            if (levelDifference !== 0) {
                return levelDifference;
            }

            return (
                Number(right.confidenceScore ?? 0) -
                Number(left.confidenceScore ?? 0)
            );
        })
        .slice(0, 5)
        .map((userSkill) => {
            const evidences =
                userSkill.evidences ?? [];

            return {
                userSkillId: userSkill.id,

                skillId: userSkill.skill!.id,

                name: userSkill.skill!.name,

                level: Number(
                    userSkill.level,
                ),

                years:
                    userSkill.years === null ||
                        userSkill.years === undefined
                        ? null
                        : Number(
                            userSkill.years,
                        ),

                confidenceScore:
                    userSkill.confidenceScore === null ||
                        userSkill.confidenceScore === undefined
                        ? null
                        : Number(
                            userSkill.confidenceScore,
                        ),

                hasApprovedEvidence:
                    evidences.some(
                        (evidence) =>
                            evidence.status ===
                            'APPROVED',
                    ),

                approvedEvidenceCount:
                    evidences.filter(
                        (evidence) =>
                            evidence.status ===
                            'APPROVED',
                    ).length,

                pendingEvidenceCount:
                    evidences.filter(
                        (evidence) =>
                            evidence.status ===
                            'PENDING',
                    ).length,
            };
        });

    const talentUpdateTimes = [
        ...userSkills.map(
            (userSkill) =>
                userSkill.updatedAt,
        ),

        ...evidenceList.map(
            (evidence) =>
                evidence.updatedAt,
        ),
    ]
        .filter(Boolean)
        .map(
            (date) =>
                new Date(
                    date,
                ).getTime(),
        )
        .filter(
            (time) =>
                Number.isFinite(
                    time,
                ),
        );

    const lastTalentDataUpdatedAt =
        talentUpdateTimes.length > 0
            ? new Date(
                Math.max(
                    ...talentUpdateTimes,
                ),
            )
            : user.updatedAt
                ? new Date(
                    user.updatedAt,
                )
                : null;

    return {
        employee: {
            id:
                user.id,

            fullName:
                user.fullName,

            email:
                user.email,

            title:
                user.title,

            status:
                user.status,

            role:
                user.role
                    ? {
                        id:
                            user.role.id,

                        name:
                            user.role.name,
                    }
                    : null,
        },

        skillSummary: {
            totalSkills:
                userSkills.length,

            skillsWithApprovedEvidence,

            totalEvidences:
                evidenceList.length,

            approvedEvidences:
                approvedEvidences.length,

            pendingEvidences:
                pendingEvidences.length,

            rejectedEvidences:
                rejectedEvidences.length,

            evidenceCoverageRate:
                userSkills.length === 0
                    ? 0
                    : Number(
                        (
                            (
                                skillsWithApprovedEvidence /
                                userSkills.length
                            ) *
                            100
                        ).toFixed(1),
                    ),
        },

        topSkills,

        performance:
            latestReview
                ? {
                    latestFinalScore:
                        Number(
                            latestReview.finalScore,
                        ),

                    latestReviewCycle:
                        latestReview.reviewCycle
                            ? {
                                id:
                                    latestReview.reviewCycle
                                        .id,

                                name:
                                    latestReview.reviewCycle
                                        .name,
                            }
                            : null,

                    reviewedAt:
                        latestReview.updatedAt ??
                        latestReview.createdAt,
                }
                : {
                    latestFinalScore:
                        null,

                    latestReviewCycle:
                        null,

                    reviewedAt:
                        null,
                },

        lastTalentDataUpdatedAt,
    };
}