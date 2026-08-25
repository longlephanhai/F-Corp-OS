import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import { GetHrTalentsDto } from './dto/get-hr-talents.dto';

@Injectable()
export class HrTalentsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * HR Talent Directory
   *
   * Chỉ READ dữ liệu từ:
   * User -> UserSkill -> Skill -> SkillEvidence
   *
   * Không thay đổi ownership/business flow
   * của Developer hoặc PM.
   */
  async findAll(query: GetHrTalentsDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      role,
    } = query;

    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')

      // Role
      .leftJoinAndSelect(
        'user.role',
        'role',
      )

      // UserSkill
      .leftJoinAndSelect(
        'user.userSkills',
        'userSkill',
        'userSkill.isDeleted = :userSkillDeleted',
        {
          userSkillDeleted: false,
        },
      )

      // Skill master data
      .leftJoinAndSelect(
        'userSkill.skill',
        'skill',
        'skill.isDeleted = :skillDeleted',
        {
          skillDeleted: false,
        },
      )

      // Skill Evidence
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

    /**
     * Search tên hoặc email.
     */
    if (search?.trim()) {
      queryBuilder.andWhere(
        `(
          user.fullName LIKE :search
          OR user.email LIKE :search
        )`,
        {
          search: `%${search.trim()}%`,
        },
      );
    }

    /**
     * Filter theo workforce status.
     */
    if (status) {
      queryBuilder.andWhere(
        'user.status = :status',
        {
          status,
        },
      );
    }

    /**
     * Filter theo role name.
     *
     * Ví dụ:
     * ?role=DEVELOPER
     */
    if (role?.trim()) {
      queryBuilder.andWhere(
        'role.name = :role',
        {
          role: role.trim(),
        },
      );
    }

    queryBuilder
      .orderBy(
        'user.fullName',
        'ASC',
      )
      .skip(skip)
      .take(limit);

    const [users, total] =
      await queryBuilder.getManyAndCount();

    const result = users.map((user) => {
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

      /**
       * Một skill được tính là có approved evidence
       * khi ít nhất một evidence của UserSkill đó
       * mang status APPROVED.
       *
       * Chưa gọi nó là "verified skill" ở domain level
       * vì UserSkill hiện không có trường verified.
       */
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

      /**
       * Top skill tạm thời ưu tiên:
       *
       * 1. level cao hơn
       * 2. confidenceScore cao hơn
       *
       * Đây chỉ là sorting để hiển thị,
       * KHÔNG phải thuật toán Talent Ranking.
       */
      const topSkills = [
        ...userSkills,
      ]
        .filter(
          (userSkill) =>
            Boolean(userSkill.skill),
        )
        .sort((a, b) => {
          const levelDifference =
            Number(b.level ?? 0) -
            Number(a.level ?? 0);

          if (levelDifference !== 0) {
            return levelDifference;
          }

          return (
            Number(
              b.confidenceScore ?? 0,
            ) -
            Number(
              a.confidenceScore ?? 0,
            )
          );
        })
        .slice(0, 5)
        .map((userSkill) => {
          const evidences =
            userSkill.evidences ?? [];

          return {
            userSkillId:
              userSkill.id,

            skillId:
              userSkill.skill?.id,

            name:
              userSkill.skill?.name,

            level:
              Number(userSkill.level),

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

      return {
        id: user.id,

        fullName: user.fullName,

        email: user.email,

        title: user.title,

        status: user.status,

        role: user.role
          ? {
              id: user.role.id,
              name: user.role.name,
            }
          : null,

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
        },

        topSkills,
      };
    });

    return {
      meta: {
        currentPage: Number(page),

        pageSize: Number(limit),

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