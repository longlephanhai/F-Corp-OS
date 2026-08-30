import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReviewRecordStatus } from 'common/enum/hr-review.enum';
import { ReviewRecord } from 'modules/hr-reviews/entities/review-record.entity';
import { User } from 'modules/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class HrTalentProfileService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(ReviewRecord)
        private readonly reviewRecordRepository: Repository<ReviewRecord>,
    ) { }

    async findOne(employeeId: string) {
        const user = await this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect(
                'user.role',
                'role',
            )
            .leftJoinAndSelect(
                'user.manager',
                'manager',
            )
            .leftJoinAndSelect(
                'user.userSkills',
                'userSkill',
                'userSkill.isDeleted = :userSkillDeleted',
                {
                    userSkillDeleted: false,
                },
            )
            .leftJoinAndSelect(
                'userSkill.skill',
                'skill',
                'skill.isDeleted = :skillDeleted',
                {
                    skillDeleted: false,
                },
            )
            .leftJoinAndSelect(
                'userSkill.evidences',
                'evidence',
                'evidence.isDeleted = :evidenceDeleted',
                {
                    evidenceDeleted: false,
                },
            )
            .where(
                'user.id = :employeeId',
                {
                    employeeId,
                },
            )
            .andWhere(
                'user.isDeleted = :userDeleted',
                {
                    userDeleted: false,
                },
            )
            .getOne();

        if (!user) {
            throw new NotFoundException(
                'Không tìm thấy nhân sự.',
            );
        }

        /*
         * ReviewRecord không có relation ngược trên User,
         * nên lấy riêng bằng repository.
         */
        const reviewRecords =
            await this.reviewRecordRepository.find({
                where: {
                    employee: {
                        id: employeeId,
                    },
                    isDeleted: false,
                },
                relations: {
                    reviewCycle: true,
                },
                order: {
                    createdAt: 'DESC',
                },
            });

        const userSkills =
            user.userSkills ?? [];

        const evidenceList =
            userSkills.flatMap(
                (userSkill) =>
                    userSkill.evidences ?? [],
            );

        const approvedEvidences =
            evidenceList.filter(
                (evidence) =>
                    evidence.status === 'APPROVED',
            );

        const pendingEvidences =
            evidenceList.filter(
                (evidence) =>
                    evidence.status === 'PENDING',
            );

        const rejectedEvidences =
            evidenceList.filter(
                (evidence) =>
                    evidence.status === 'REJECTED',
            );

        const skillsWithApprovedEvidence =
            userSkills.filter(
                (userSkill) =>
                    (
                        userSkill.evidences ?? []
                    ).some(
                        (evidence) =>
                            evidence.status ===
                            'APPROVED',
                    ),
            ).length;

        /*
         * Performance summary chỉ dựa trên review
         * đã COMPLETED và có finalScore.
         */
        const completedReviews =
            reviewRecords.filter(
                (review) =>
                    review.status ===
                    ReviewRecordStatus.COMPLETED &&
                    review.finalScore !== null &&
                    review.finalScore !== undefined,
            );

        const averageFinalScore =
            completedReviews.length > 0
                ? completedReviews.reduce(
                    (total, review) =>
                        total +
                        Number(
                            review.finalScore,
                        ),
                    0,
                ) /
                completedReviews.length
                : null;

        const latestCompletedReview =
            completedReviews[0] ?? null;

        /*
         * Xác định lần cuối dữ liệu talent được cập nhật.
         * Không áp rule "stale 60 ngày" ở bước này.
         */
        const talentUpdateTimes = [
            user.updatedAt,
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
                    new Date(date).getTime(),
            );

        const lastTalentDataUpdatedAt =
            talentUpdateTimes.length > 0
                ? new Date(
                    Math.max(
                        ...talentUpdateTimes,
                    ),
                )
                : null;

        const skills = userSkills
            .filter(
                (userSkill) =>
                    Boolean(userSkill.skill),
            )
            .sort(
                (a, b) =>
                    Number(b.level ?? 0) -
                    Number(a.level ?? 0),
            )
            .map((userSkill) => {
                const evidences =
                    userSkill.evidences ?? [];

                return {
                    userSkillId:
                        userSkill.id,

                    skill: {
                        id:
                            userSkill.skill.id,

                        name:
                            userSkill.skill.name,
                    },

                    description:
                        userSkill.description,

                    level:
                        Number(
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
                        userSkill.confidenceScore ===
                            null ||
                            userSkill.confidenceScore ===
                            undefined
                            ? null
                            : Number(
                                userSkill.confidenceScore,
                            ),

                    evidenceNote:
                        userSkill.evidenceNote,

                    hasApprovedEvidence:
                        evidences.some(
                            (evidence) =>
                                evidence.status ===
                                'APPROVED',
                        ),

                    evidenceSummary: {
                        total:
                            evidences.length,

                        approved:
                            evidences.filter(
                                (evidence) =>
                                    evidence.status ===
                                    'APPROVED',
                            ).length,

                        pending:
                            evidences.filter(
                                (evidence) =>
                                    evidence.status ===
                                    'PENDING',
                            ).length,

                        rejected:
                            evidences.filter(
                                (evidence) =>
                                    evidence.status ===
                                    'REJECTED',
                            ).length,
                    },

                    evidences:
                        evidences.map(
                            (evidence) => ({
                                id:
                                    evidence.id,

                                type:
                                    evidence.type,

                                title:
                                    evidence.title,

                                url:
                                    evidence.url,

                                description:
                                    evidence.description,

                                status:
                                    evidence.status,

                                rejectReason:
                                    evidence.rejectReason,

                                createdAt:
                                    evidence.createdAt,

                                updatedAt:
                                    evidence.updatedAt,
                            }),
                        ),

                    updatedAt:
                        userSkill.updatedAt,
                };
            });

        const performanceHistory =
            reviewRecords.map(
                (review) => ({
                    id:
                        review.id,

                    status:
                        review.status,

                    tempScore:
                        review.tempScore ===
                            null ||
                            review.tempScore ===
                            undefined
                            ? null
                            : Number(
                                review.tempScore,
                            ),

                    finalScore:
                        review.finalScore ===
                            null ||
                            review.finalScore ===
                            undefined
                            ? null
                            : Number(
                                review.finalScore,
                            ),

                    reviewerNote:
                        review.reviewerNote,

                    reviewCycle:
                        review.reviewCycle
                            ? {
                                id:
                                    review.reviewCycle
                                        .id,

                                name:
                                    review.reviewCycle
                                        .name,

                                startDate:
                                    review.reviewCycle
                                        .startDate,

                                endDate:
                                    review.reviewCycle
                                        .endDate,

                                status:
                                    review.reviewCycle
                                        .status,
                            }
                            : null,

                    createdAt:
                        review.createdAt,

                    updatedAt:
                        review.updatedAt,
                }),
            );

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

                manager:
                    user.manager
                        ? {
                            id:
                                user.manager.id,

                            fullName:
                                user.manager.fullName,

                            email:
                                user.manager.email,
                        }
                        : null,
            },

            talentSummary: {
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

                lastTalentDataUpdatedAt,
            },

            skills,

            performanceSummary: {
                totalReviews:
                    reviewRecords.length,

                completedReviews:
                    completedReviews.length,

                averageFinalScore:
                    averageFinalScore === null
                        ? null
                        : Number(
                            averageFinalScore.toFixed(
                                2,
                            ),
                        ),

                latestFinalScore:
                    latestCompletedReview
                        ? Number(
                            latestCompletedReview.finalScore,
                        )
                        : null,

                latestReviewCycle:
                    latestCompletedReview
                        ?.reviewCycle
                        ? {
                            id:
                                latestCompletedReview
                                    .reviewCycle.id,

                            name:
                                latestCompletedReview
                                    .reviewCycle.name,
                        }
                        : null,
            },

            performanceHistory,
        };
    }
}