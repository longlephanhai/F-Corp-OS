import {
  Injectable,
  NotFoundException,
} from '@nestjs/common'; import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import { GetHrTalentsDto } from './dto/get-hr-talents.dto';
import { ReviewRecord } from 'modules/hr-reviews/entities/review-record.entity';
import { ReviewRecordStatus } from 'common/enum/hr-review.enum';
import { Skill } from 'modules/skills/entities/skill.entity';
import { UserStatusType } from 'common/enum/user.enum';
import { GetHrSkillMatrixDto } from './dto/get-hr-skill-matrix.dto';

@Injectable()
export class HrTalentsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(ReviewRecord)
    private readonly reviewRecordRepository: Repository<ReviewRecord>,

    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
  ) { }

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