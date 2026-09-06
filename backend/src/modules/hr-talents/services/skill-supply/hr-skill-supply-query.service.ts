import {
  Injectable,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  UserStatusType,
} from 'common/enum/user.enum';

import {
  Skill,
} from 'modules/skills/entities/skill.entity';

import {
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

import {
  HrSkillSupplyPage,
  HrSkillSupplySnapshot,
} from './hr-skill-supply.types';

interface FindSkillSupplyPageOptions {
  page?: number;

  limit?: number;

  search?: string;
}

@Injectable()
export class HrSkillSupplyQueryService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepository:
      Repository<Skill>,
  ) {}

  async findPage(
    options:
      FindSkillSupplyPageOptions = {},
  ): Promise<HrSkillSupplyPage> {
    const {
      page = 1,
      limit = 20,
      search,
    } = options;

    const skip =
      (page - 1) * limit;

    const total =
      await this.countSkills(
        search,
      );

    const queryBuilder =
      this.createSupplyQuery(
        search,
      );

    queryBuilder
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
      await queryBuilder
        .getRawMany();

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
                total /
                  limit,
              ),

        total,
      },

      result:
        this.mapRows(
          rawRows,
        ),
    };
  }

  /**
   * Lấy toàn bộ Skill Supply.
   *
   * Dùng cho:
   * - Supply Insight
   * - Supply Risk
   *
   * Không paginate tại đây vì các analytics
   * cần nhìn toàn catalog trước khi tổng hợp.
   */
  async findAll(
    search?: string,
  ): Promise<
    HrSkillSupplySnapshot[]
  > {
    const queryBuilder =
      this.createSupplyQuery(
        search,
      );

    queryBuilder
      .orderBy(
        'COUNT(DISTINCT user.id)',
        'DESC',
      )
      .addOrderBy(
        'skill.name',
        'ASC',
      );

    const rawRows =
      await queryBuilder
        .getRawMany();

    return this.mapRows(
      rawRows,
    );
  }

  private async countSkills(
    search?: string,
  ): Promise<number> {
    const queryBuilder =
      this.skillRepository
        .createQueryBuilder(
          'skill',
        )
        .where(
          'skill.isDeleted = :skillDeleted',
          {
            skillDeleted:
              false,
          },
        );

    if (search?.trim()) {
      queryBuilder.andWhere(
        'LOWER(skill.name) LIKE LOWER(:search)',
        {
          search:
            `%${search.trim()}%`,
        },
      );
    }

    return queryBuilder
      .getCount();
  }

  private createSupplyQuery(
    search?: string,
  ): SelectQueryBuilder<Skill> {
    const queryBuilder =
      this.skillRepository
        .createQueryBuilder(
          'skill',
        )

        /*
         * Skill là root.
         *
         * Nhờ LEFT JOIN, skill chưa có
         * nhân sự vẫn xuất hiện với
         * supply = 0.
         */
        .leftJoin(
          'skill.userSkills',
          'userSkill',
          'userSkill.isDeleted = :userSkillDeleted',
          {
            userSkillDeleted:
              false,
          },
        )

        .leftJoin(
          'userSkill.user',
          'user',
          'user.isDeleted = :userDeleted',
          {
            userDeleted:
              false,
          },
        )

        .leftJoin(
          'userSkill.evidences',
          'evidence',
          'evidence.isDeleted = :evidenceDeleted',
          {
            evidenceDeleted:
              false,
          },
        )

        .where(
          'skill.isDeleted = :skillDeleted',
          {
            skillDeleted:
              false,
          },
        );

    if (search?.trim()) {
      queryBuilder.andWhere(
        'LOWER(skill.name) LIKE LOWER(:search)',
        {
          search:
            `%${search.trim()}%`,
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
       * Tổng nhân sự sở hữu skill.
       */
      .addSelect(
        'COUNT(DISTINCT user.id)',
        'totalEmployees',
      )

      /*
       * Level >= 3.
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
       * Level >= 4.
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
       * Nhân sự có ít nhất một
       * minh chứng APPROVED
       * cho skill tương ứng.
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
        'verifiedEmployees',
      )

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
       * Phân bố nguồn lực.
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
        approvedStatus:
          'APPROVED',

        pendingStatus:
          'PENDING',

        availableStatus:
          UserStatusType.AVAILABLE,

        inProjectStatus:
          UserStatusType.IN_PROJECT,

        benchStatus:
          UserStatusType.BENCH,
      })

      .groupBy(
        'skill.id',
      )
      .addGroupBy(
        'skill.name',
      )
      .addGroupBy(
        'skill.description',
      );

    return queryBuilder;
  }

  private mapRows(
    rawRows: any[],
  ): HrSkillSupplySnapshot[] {
    return rawRows.map(
      (row) => {
        const totalEmployees =
          Number(
            row.totalEmployees ??
              0,
          );

        const verifiedEmployees =
          Number(
            row.verifiedEmployees ??
              0,
          );

        const verificationRate =
          totalEmployees === 0
            ? 0
            : Number(
                (
                  (
                    verifiedEmployees /
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
            row.description ??
            null,

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

          verifiedEmployees,

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
  }
}