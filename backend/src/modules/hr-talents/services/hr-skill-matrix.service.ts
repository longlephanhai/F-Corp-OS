import {
    Injectable,
    NotFoundException,
} from '@nestjs/common'; import { InjectRepository } from '@nestjs/typeorm';
import { Skill } from 'modules/skills/entities/skill.entity';
import { Repository } from 'typeorm';
import { GetHrSkillMatrixDto } from '../dto/get-hr-skill-matrix.dto';
import { UserSkill } from 'modules/user-skill/entities/user-skill.entity';
import { GetHrSkillEmployeesDto } from '../dto/get-hr-skill-employees.dto';
import { HrSkillSupplyQueryService } from './skill-supply/hr-skill-supply-query.service';

@Injectable()
export class HrSkillMatrixService {
    constructor(
        @InjectRepository(Skill)
        private readonly skillRepository: Repository<Skill>,

        @InjectRepository(UserSkill)
        private readonly userSkillRepository: Repository<UserSkill>,

        private readonly skillSupplyQueryService:
            HrSkillSupplyQueryService,
    ) { }

    async getSkillMatrix(
        query: GetHrSkillMatrixDto,
    ) {
        const {
            page = 1,
            limit = 20,
            search,
        } = query;

        /*
         * Skill Matrix không tự định nghĩa
         * Skill Supply nữa.
         *
         * Nguồn dữ liệu aggregate chung:
         * HrSkillSupplyQueryService.
         */
        const supplyPage =
            await this.skillSupplyQueryService
                .findPage({
                    page,
                    limit,
                    search,
                });

        /*
         * Giữ nguyên API contract cũ
         * để frontend không bị breaking change.
         */
        const result =
            supplyPage.result.map(
                (skill) => ({
                    skillId:
                        skill.skillId,

                    name:
                        skill.name,

                    description:
                        skill.description,

                    totalEmployees:
                        skill.totalEmployees,

                    level3Plus:
                        skill.level3Plus,

                    level4Plus:
                        skill.level4Plus,

                    /*
                     * Shared supply gọi field này
                     * là verifiedEmployees.
                     *
                     * Skill Matrix giữ tên response cũ
                     * để backward compatible.
                     */
                    employeesWithApprovedEvidence:
                        skill.verifiedEmployees,

                    verificationRate:
                        skill.verificationRate,

                    evidence: {
                        approved:
                            skill.evidence.approved,

                        pending:
                            skill.evidence.pending,
                    },

                    workforce: {
                        available:
                            skill.workforce.available,

                        inProject:
                            skill.workforce.inProject,

                        bench:
                            skill.workforce.bench,
                    },
                }),
            );

        return {
            meta:
                supplyPage.meta,

            result,
        };
    }

    async getSkillEmployees(
        skillId: string,
        query: GetHrSkillEmployeesDto,
    ) {
        const {
            page = 1,
            limit = 10,
            status,
        } = query;

        const skip = (page - 1) * limit;

        /*
         * Kiểm tra skill tồn tại trước.
         * HR drill-down một skill không tồn tại phải trả 404,
         * không trả list rỗng gây hiểu nhầm.
         */
        const skill =
            await this.skillRepository.findOne({
                where: {
                    id: skillId,
                    isDeleted: false,
                },
            });

        if (!skill) {
            throw new NotFoundException(
                'Không tìm thấy kỹ năng.',
            );
        }

        const queryBuilder =
            this.userSkillRepository
                .createQueryBuilder('userSkill')

                .leftJoinAndSelect(
                    'userSkill.user',
                    'user',
                )

                .leftJoinAndSelect(
                    'user.role',
                    'role',
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
                    'userSkill.skillId = :skillId',
                    {
                        skillId,
                    },
                )

                .andWhere(
                    'userSkill.isDeleted = :userSkillDeleted',
                    {
                        userSkillDeleted: false,
                    },
                )

                .andWhere(
                    'user.isDeleted = :userDeleted',
                    {
                        userDeleted: false,
                    },
                );

        if (status) {
            queryBuilder.andWhere(
                'user.status = :status',
                {
                    status,
                },
            );
        }

        /*
         * Một UserSkill có thể có nhiều Evidence.
         * distinct giúp tránh duplicate entity khi join evidence.
         */
        queryBuilder
            .distinct(true)
            .orderBy(
                'userSkill.level',
                'DESC',
            )
            .addOrderBy(
                'userSkill.confidenceScore',
                'DESC',
            )
            .addOrderBy(
                'user.fullName',
                'ASC',
            )
            .skip(skip)
            .take(limit);

        const [userSkills, total] =
            await queryBuilder.getManyAndCount();

        const result =
            userSkills.map((userSkill) => {
                const evidences =
                    userSkill.evidences ?? [];

                const approved =
                    evidences.filter(
                        (evidence) =>
                            evidence.status ===
                            'APPROVED',
                    ).length;

                const pending =
                    evidences.filter(
                        (evidence) =>
                            evidence.status ===
                            'PENDING',
                    ).length;

                const rejected =
                    evidences.filter(
                        (evidence) =>
                            evidence.status ===
                            'REJECTED',
                    ).length;

                return {
                    userSkillId:
                        userSkill.id,

                    employee: {
                        id:
                            userSkill.user.id,

                        fullName:
                            userSkill.user.fullName,

                        email:
                            userSkill.user.email,

                        title:
                            userSkill.user.title,

                        status:
                            userSkill.user.status,

                        role:
                            userSkill.user.role
                                ? {
                                    id:
                                        userSkill.user.role
                                            .id,

                                    name:
                                        userSkill.user.role
                                            .name,
                                }
                                : null,
                    },

                    level:
                        Number(
                            userSkill.level,
                        ),

                    years:
                        userSkill.years ===
                            null ||
                            userSkill.years ===
                            undefined
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

                    hasApprovedEvidence:
                        approved > 0,

                    evidenceSummary: {
                        total:
                            evidences.length,

                        approved,

                        pending,

                        rejected,
                    },

                    updatedAt:
                        userSkill.updatedAt,
                };
            });

        return {
            skill: {
                id:
                    skill.id,

                name:
                    skill.name,

                description:
                    skill.description,
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
                            total / limit,
                        ),

                total,
            },

            result,
        };
    }
}