import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserStatusType } from 'common/enum/user.enum';
import { Skill } from 'modules/skills/entities/skill.entity';
import { Repository } from 'typeorm';
import { GetHrSkillMatrixDto } from '../dto/get-hr-skill-matrix.dto';

@Injectable()
export class HrSkillMatrixService {
    constructor(
        @InjectRepository(Skill)
        private readonly skillRepository: Repository<Skill>,
    ) { }

    async getSkillMatrix(
        query: GetHrSkillMatrixDto,
    ) {
        const {
            page = 1,
            limit = 20,
            search,
        } = query;

        const skip = (page - 1) * limit;

        /*
         * Query count riêng để pagination không bị ảnh hưởng
         * bởi GROUP BY của query thống kê bên dưới.
         */
        const countQuery =
            this.skillRepository
                .createQueryBuilder('skill')
                .where(
                    'skill.isDeleted = :skillDeleted',
                    {
                        skillDeleted: false,
                    },
                );

        if (search?.trim()) {
            countQuery.andWhere(
                'LOWER(skill.name) LIKE LOWER(:search)',
                {
                    search: `%${search.trim()}%`,
                },
            );
        }

        const total =
            await countQuery.getCount();

        /*
         * Skill là root của query.
         *
         * Điều này có chủ ý:
         * ngay cả skill chưa có nhân sự sở hữu
         * vẫn phải xuất hiện trong Skill Matrix với supply = 0.
         *
         * Đây rất quan trọng cho Skill Gap sau này.
         */
        const queryBuilder =
            this.skillRepository
                .createQueryBuilder('skill')

                .leftJoin(
                    'skill.userSkills',
                    'userSkill',
                    'userSkill.isDeleted = :userSkillDeleted',
                    {
                        userSkillDeleted: false,
                    },
                )

                .leftJoin(
                    'userSkill.user',
                    'user',
                    'user.isDeleted = :userDeleted',
                    {
                        userDeleted: false,
                    },
                )

                .leftJoin(
                    'userSkill.evidences',
                    'evidence',
                    'evidence.isDeleted = :evidenceDeleted',
                    {
                        evidenceDeleted: false,
                    },
                )

                .where(
                    'skill.isDeleted = :skillDeleted',
                    {
                        skillDeleted: false,
                    },
                );

        if (search?.trim()) {
            queryBuilder.andWhere(
                'LOWER(skill.name) LIKE LOWER(:search)',
                {
                    search: `%${search.trim()}%`,
                },
            );
        }

        queryBuilder
            .select(
                'skill.id',
                'skillId',
            )

            .addSelect(
                'skill.name',
                'skillName',
            )

            .addSelect(
                'skill.description',
                'description',
            )

            /*
             * Tổng số nhân sự sở hữu skill.
             *
             * COUNT DISTINCT user.id để tránh một người bị
             * đếm nhiều lần vì có nhiều evidence.
             */
            .addSelect(
                'COUNT(DISTINCT user.id)',
                'totalEmployees',
            )

            /*
             * Nhân sự level >= 3.
             */
            .addSelect(
                `
        COUNT(
          DISTINCT CASE
            WHEN userSkill.level >= 3
            THEN user.id
          END
        )
      `,
                'level3Plus',
            )

            /*
             * Nhân sự level >= 4.
             */
            .addSelect(
                `
        COUNT(
          DISTINCT CASE
            WHEN userSkill.level >= 4
            THEN user.id
          END
        )
      `,
                'level4Plus',
            )

            /*
             * Số nhân sự có ít nhất một APPROVED evidence
             * cho skill này.
             */
            .addSelect(
                `
        COUNT(
          DISTINCT CASE
            WHEN
              user.id IS NOT NULL
              AND evidence.status = :approvedStatus
            THEN user.id
          END
        )
      `,
                'employeesWithApprovedEvidence',
            )

            /*
             * Tổng evidence APPROVED.
             */
            .addSelect(
                `
        COUNT(
          DISTINCT CASE
            WHEN
              user.id IS NOT NULL
              AND evidence.status = :approvedStatus
            THEN evidence.id
          END
        )
      `,
                'approvedEvidenceCount',
            )

            /*
             * Tổng evidence đang PENDING.
             */
            .addSelect(
                `
        COUNT(
          DISTINCT CASE
            WHEN
              user.id IS NOT NULL
              AND evidence.status = :pendingStatus
            THEN evidence.id
          END
        )
      `,
                'pendingEvidenceCount',
            )

            /*
             * Workforce distribution.
             */
            .addSelect(
                `
        COUNT(
          DISTINCT CASE
            WHEN user.status = :availableStatus
            THEN user.id
          END
        )
      `,
                'availableEmployees',
            )

            .addSelect(
                `
        COUNT(
          DISTINCT CASE
            WHEN user.status = :inProjectStatus
            THEN user.id
          END
        )
      `,
                'inProjectEmployees',
            )

            .addSelect(
                `
        COUNT(
          DISTINCT CASE
            WHEN user.status = :benchStatus
            THEN user.id
          END
        )
      `,
                'benchEmployees',
            )

            .setParameters({
                approvedStatus: 'APPROVED',
                pendingStatus: 'PENDING',

                availableStatus:
                    UserStatusType.AVAILABLE,

                inProjectStatus:
                    UserStatusType.IN_PROJECT,

                benchStatus:
                    UserStatusType.BENCH,
            })

            .groupBy('skill.id')
            .addGroupBy('skill.name')
            .addGroupBy(
                'skill.description',
            )

            /*
             * Skill có supply cao hiển thị trước.
             */
            .orderBy(
                'COUNT(DISTINCT user.id)',
                'DESC',
            )

            .addOrderBy(
                'skill.name',
                'ASC',
            )

            .offset(skip)
            .limit(limit);

        const rawRows =
            await queryBuilder.getRawMany();

        const result = rawRows.map(
            (row) => {
                const totalEmployees =
                    Number(
                        row.totalEmployees ??
                        0,
                    );

                const employeesWithApprovedEvidence =
                    Number(
                        row.employeesWithApprovedEvidence ??
                        0,
                    );

                /*
                 * Verification rate:
                 *
                 * % nhân sự sở hữu skill mà có ít nhất
                 * một APPROVED evidence.
                 *
                 * Không gọi đây là confidenceScore vì
                 * đó là concept khác.
                 */
                const verificationRate =
                    totalEmployees === 0
                        ? 0
                        : Number(
                            (
                                (
                                    employeesWithApprovedEvidence /
                                    totalEmployees
                                ) *
                                100
                            ).toFixed(1),
                        );

                return {
                    skillId:
                        row.skillId,

                    name:
                        row.skillName,

                    description:
                        row.description,

                    totalEmployees,

                    level3Plus:
                        Number(
                            row.level3Plus ??
                            0,
                        ),

                    level4Plus:
                        Number(
                            row.level4Plus ??
                            0,
                        ),

                    employeesWithApprovedEvidence,

                    verificationRate,

                    evidence: {
                        approved:
                            Number(
                                row.approvedEvidenceCount ??
                                0,
                            ),

                        pending:
                            Number(
                                row.pendingEvidenceCount ??
                                0,
                            ),
                    },

                    workforce: {
                        available:
                            Number(
                                row.availableEmployees ??
                                0,
                            ),

                        inProject:
                            Number(
                                row.inProjectEmployees ??
                                0,
                            ),

                        bench:
                            Number(
                                row.benchEmployees ??
                                0,
                            ),
                    },
                };
            },
        );

        return {
            meta: {
                currentPage:
                    Number(page),

                pageSize:
                    Number(limit),

                pages:
                    total === 0
                        ? 0
                        : Math.ceil(
                            total / limit,
                        ),

                total,
            },

            result,
        };
    }
}