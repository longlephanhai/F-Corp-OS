import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UserStatusType } from 'common/enum/user.enum';
import { User } from 'modules/users/entities/user.entity';

import { Repository } from 'typeorm';

import { GetHrBenchTalentsDto } from '../../dto/get-hr-bench-talents.dto';

@Injectable()
export class HrBenchTalentQueryService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository:
      Repository<User>,
  ) {}

  async findPage(
    query: GetHrBenchTalentsDto,
  ) {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      skillId,
      minLevel,
      verified,
    } = query;

    const skip =
      (page - 1) * limit;

    const queryBuilder =
      this.userRepository
        .createQueryBuilder('user')

        /*
         * Load toàn bộ Talent data
         * để response không bị mất skill
         * khi filter.
         */
        .leftJoinAndSelect(
          'user.role',
          'role',
        )

        .leftJoinAndSelect(
          'user.userSkills',
          'userSkill',
          'userSkill.isDeleted = :userSkillDeleted',
          {
            userSkillDeleted:
              false,
          },
        )

        .leftJoinAndSelect(
          'userSkill.skill',
          'skill',
          'skill.isDeleted = :skillDeleted',
          {
            skillDeleted:
              false,
          },
        )

        .leftJoinAndSelect(
          'userSkill.evidences',
          'evidence',
          'evidence.isDeleted = :evidenceDeleted',
          {
            evidenceDeleted:
              false,
          },
        )

        .where(
          'user.isDeleted = :userDeleted',
          {
            userDeleted:
              false,
          },
        )

        /*
         * Bench Pool luôn BENCH.
         */
        .andWhere(
          'user.status = :benchStatus',
          {
            benchStatus:
              UserStatusType.BENCH,
          },
        );

    this.applySearchFilter(
      queryBuilder,
      search,
    );

    this.applyRoleFilter(
      queryBuilder,
      role,
    );

    this.applyTalentFilters(
      queryBuilder,
      {
        skillId,
        minLevel,
        verified,
      },
    );

    queryBuilder
      .distinct(true)
      .orderBy(
        'user.fullName',
        'ASC',
      )
      .skip(skip)
      .take(limit);

    const [
      users,
      total,
    ] =
      await queryBuilder
        .getManyAndCount();

    return {
      users,

      total,
    };
  }

  private applySearchFilter(
    queryBuilder:
      ReturnType<
        Repository<User>[
          'createQueryBuilder'
        ]
      >,

    search?: string,
  ) {
    if (!search?.trim()) {
      return;
    }

    queryBuilder.andWhere(
      `(
        user.fullName LIKE :search
        OR user.email LIKE :search
      )`,
      {
        search:
          `%${search.trim()}%`,
      },
    );
  }

  private applyRoleFilter(
    queryBuilder:
      ReturnType<
        Repository<User>[
          'createQueryBuilder'
        ]
      >,

    role?: string,
  ) {
    if (!role?.trim()) {
      return;
    }

    queryBuilder.andWhere(
      'role.name = :role',
      {
        role:
          role.trim(),
      },
    );
  }

  private applyTalentFilters(
    queryBuilder:
      ReturnType<
        Repository<User>[
          'createQueryBuilder'
        ]
      >,

    filters: {
      skillId?: string;

      minLevel?: number;

      verified?: boolean;
    },
  ) {
    const {
      skillId,
      minLevel,
      verified,
    } = filters;

    const needsSkillFilter =
      Boolean(skillId) ||
      minLevel !== undefined ||
      verified === true;

    if (!needsSkillFilter) {
      return;
    }

    /*
     * Alias riêng để FILTER.
     *
     * userSkill phía trên vẫn dùng
     * để load toàn bộ skill profile.
     */
    queryBuilder.leftJoin(
      'user.userSkills',
      'filterUserSkill',
      'filterUserSkill.isDeleted = :filterUserSkillDeleted',
      {
        filterUserSkillDeleted:
          false,
      },
    );

    if (skillId) {
      queryBuilder.andWhere(
        'filterUserSkill.skillId = :skillId',
        {
          skillId,
        },
      );
    }

    if (
      minLevel !== undefined
    ) {
      queryBuilder.andWhere(
        'filterUserSkill.level >= :minLevel',
        {
          minLevel,
        },
      );
    }

    if (verified === true) {
      queryBuilder
        .leftJoin(
          'filterUserSkill.evidences',
          'filterEvidence',
          `
            filterEvidence.isDeleted = :filterEvidenceDeleted
            AND filterEvidence.status = :approvedStatus
          `,
          {
            filterEvidenceDeleted:
              false,

            approvedStatus:
              'APPROVED',
          },
        )

        .andWhere(
          'filterEvidence.id IS NOT NULL',
        );
    }
  }
}