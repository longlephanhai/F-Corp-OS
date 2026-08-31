import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'modules/users/entities/user.entity';
import { Repository } from 'typeorm';

import { GetHrTalentDataQualityDto } from '../dto/get-hr-talent-data-quality.dto';

@Injectable()
export class HrTalentDataQualityService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository:
            Repository<User>,
    ) { }

    async getSummary(
        query: GetHrTalentDataQualityDto,
    ) {
        const {
            role,
            staleDays = 90,
        } = query;

        /*
         * Talent Data Quality chỉ READ dữ liệu.
         *
         * User
         *   ↓
         * UserSkill
         *   ↓
         * SkillEvidence
         *
         * Không thay đổi ownership hoặc workflow
         * của Developer / PM.
         */
        const queryBuilder =
            this.userRepository
                .createQueryBuilder('user')

                .leftJoinAndSelect(
                    'user.role',
                    'role',
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
                    'user.isDeleted = :userDeleted',
                    {
                        userDeleted: false,
                    },
                );

        /*
         * Optional role filter.
         *
         * Ví dụ:
         * ?role=DEVELOPER
         */
        if (role?.trim()) {
            queryBuilder.andWhere(
                'LOWER(role.name) = LOWER(:role)',
                {
                    role: role.trim(),
                },
            );
        }

        queryBuilder.orderBy(
            'user.fullName',
            'ASC',
        );

        const users =
            await queryBuilder.getMany();

        /*
         * Cutoff dùng cho Profile Freshness.
         *
         * staleDays = 90:
         * hồ sơ không có Talent data update
         * trong hơn 90 ngày được xem là stale.
         */
        const staleCutoff =
            new Date(
                Date.now() -
                staleDays *
                24 *
                60 *
                60 *
                1000,
            );

        const employeeQuality =
            users.map((user) => {
                const userSkills =
                    (user.userSkills ?? [])
                        .filter(
                            (userSkill) =>
                                Boolean(
                                    userSkill.skill,
                                ),
                        );

                const evidences =
                    userSkills.flatMap(
                        (userSkill) =>
                            userSkill.evidences ??
                            [],
                    );

                const approvedEvidenceCount =
                    evidences.filter(
                        (evidence) =>
                            evidence.status ===
                            'APPROVED',
                    ).length;

                const pendingEvidenceCount =
                    evidences.filter(
                        (evidence) =>
                            evidence.status ===
                            'PENDING',
                    ).length;

                const rejectedEvidenceCount =
                    evidences.filter(
                        (evidence) =>
                            evidence.status ===
                            'REJECTED',
                    ).length;

                /*
                 * Talent update time.
                 *
                 * Ưu tiên:
                 * - UserSkill.updatedAt
                 * - Evidence.updatedAt
                 *
                 * User.updatedAt chỉ làm fallback,
                 * vì User có thể thay đổi các field
                 * không thuộc Talent Profile.
                 */
                const talentUpdateTimes = [
                    ...userSkills.map(
                        (userSkill) =>
                            userSkill.updatedAt,
                    ),

                    ...evidences.map(
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

                let lastTalentDataUpdatedAt:
                    Date | null = null;

                if (
                    talentUpdateTimes.length >
                    0
                ) {
                    lastTalentDataUpdatedAt =
                        new Date(
                            Math.max(
                                ...talentUpdateTimes,
                            ),
                        );
                } else if (
                    user.updatedAt
                ) {
                    /*
                     * Fallback cho employee chưa có
                     * UserSkill/Evidence.
                     */
                    lastTalentDataUpdatedAt =
                        new Date(
                            user.updatedAt,
                        );
                }

                const hasSkills =
                    userSkills.length > 0;

                const hasApprovedEvidence =
                    approvedEvidenceCount > 0;

                const hasPendingEvidence =
                    pendingEvidenceCount > 0;

                const isStale =
                    !lastTalentDataUpdatedAt ||
                    lastTalentDataUpdatedAt <
                    staleCutoff;

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

                    quality: {
                        totalSkills:
                            userSkills.length,

                        totalEvidences:
                            evidences.length,

                        approvedEvidences:
                            approvedEvidenceCount,

                        pendingEvidences:
                            pendingEvidenceCount,

                        rejectedEvidences:
                            rejectedEvidenceCount,

                        hasSkills,

                        hasApprovedEvidence,

                        hasPendingEvidence,

                        isStale,

                        lastTalentDataUpdatedAt,
                    },
                };
            });

        const totalEmployees =
            employeeQuality.length;

        const employeesWithSkills =
            employeeQuality.filter(
                (item) =>
                    item.quality.hasSkills,
            );

        const employeesWithoutSkills =
            employeeQuality.filter(
                (item) =>
                    !item.quality.hasSkills,
            );

        const employeesWithApprovedEvidence =
            employeeQuality.filter(
                (item) =>
                    item.quality
                        .hasApprovedEvidence,
            );

        const employeesWithoutApprovedEvidence =
            employeeQuality.filter(
                (item) =>
                    !item.quality
                        .hasApprovedEvidence,
            );

        const employeesWithPendingEvidence =
            employeeQuality.filter(
                (item) =>
                    item.quality
                        .hasPendingEvidence,
            );

        const staleProfiles =
            employeeQuality.filter(
                (item) =>
                    item.quality.isStale,
            );

        const totalPendingEvidences =
            employeeQuality.reduce(
                (total, item) =>
                    total +
                    item.quality
                        .pendingEvidences,
                0,
            );

        const skillCoverageRate =
            totalEmployees === 0
                ? 0
                : Number(
                    (
                        (
                            employeesWithSkills.length /
                            totalEmployees
                        ) *
                        100
                    ).toFixed(1),
                );

        const evidenceCoverageRate =
            totalEmployees === 0
                ? 0
                : Number(
                    (
                        (
                            employeesWithApprovedEvidence.length /
                            totalEmployees
                        ) *
                        100
                    ).toFixed(1),
                );

        const freshnessRate =
            totalEmployees === 0
                ? 0
                : Number(
                    (
                        (
                            (
                                totalEmployees -
                                staleProfiles.length
                            ) /
                            totalEmployees
                        ) *
                        100
                    ).toFixed(1),
                );

        return {
            criteria: {
                role:
                    role?.trim() ||
                    null,

                staleDays,

                staleBefore:
                    staleCutoff,
            },

            summary: {
                totalEmployees,

                employeesWithSkills:
                    employeesWithSkills.length,

                employeesWithoutSkills:
                    employeesWithoutSkills.length,

                employeesWithApprovedEvidence:
                    employeesWithApprovedEvidence.length,

                employeesWithoutApprovedEvidence:
                    employeesWithoutApprovedEvidence.length,

                employeesWithPendingEvidence:
                    employeesWithPendingEvidence.length,

                totalPendingEvidences,

                staleProfiles:
                    staleProfiles.length,

                skillCoverageRate,

                evidenceCoverageRate,

                freshnessRate,
            },

            /*
             * Các dimension có thể overlap.
             *
             * Ví dụ một employee có thể đồng thời:
             * - không có skill
             * - không có approved evidence
             * - stale
             *
             * Đây là intentional.
             */
            issues: {
                withoutSkills:
                    employeesWithoutSkills,

                withoutApprovedEvidence:
                    employeesWithoutApprovedEvidence,

                pendingEvidence:
                    employeesWithPendingEvidence,

                staleProfiles,
            },
        };
    }
}