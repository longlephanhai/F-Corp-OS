import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserStatusType } from 'common/enum/user.enum';
import { Skill } from 'modules/skills/entities/skill.entity';
import { Repository } from 'typeorm';

interface SkillSupplyRow {
  skillId: string;
  name: string;

  totalEmployees: number;
  level4Plus: number;

  verifiedEmployees: number;

  availableEmployees: number;
  inProjectEmployees: number;
  benchEmployees: number;
}

@Injectable()
export class HrSkillSupplyInsightService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepository:
      Repository<Skill>,
  ) {}

  async getSummary() {
    const rawRows =
      await this.skillRepository
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
        )

        .select(
          'skill.id',
          'skillId',
        )

        .addSelect(
          'skill.name',
          'skillName',
        )

        .addSelect(
          'COUNT(DISTINCT user.id)',
          'totalEmployees',
        )

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
         * Một employee-skill pair được coi là verified
         * nếu UserSkill đó có ít nhất một evidence APPROVED.
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

          availableStatus:
            UserStatusType.AVAILABLE,

          inProjectStatus:
            UserStatusType.IN_PROJECT,

          benchStatus:
            UserStatusType.BENCH,
        })

        .groupBy('skill.id')
        .addGroupBy('skill.name')

        .getRawMany();

    const rows: SkillSupplyRow[] =
      rawRows.map((row) => ({
        skillId:
          row.skillId,

        name:
          row.skillName,

        totalEmployees:
          Number(
            row.totalEmployees ?? 0,
          ),

        level4Plus:
          Number(
            row.level4Plus ?? 0,
          ),

        verifiedEmployees:
          Number(
            row.verifiedEmployees ?? 0,
          ),

        availableEmployees:
          Number(
            row.availableEmployees ?? 0,
          ),

        inProjectEmployees:
          Number(
            row.inProjectEmployees ?? 0,
          ),

        benchEmployees:
          Number(
            row.benchEmployees ?? 0,
          ),
      }));

    const totalSkills =
      rows.length;

    const skillsWithSupply =
      rows.filter(
        (row) =>
          row.totalEmployees > 0,
      ).length;

    const zeroSupplySkills =
      rows.filter(
        (row) =>
          row.totalEmployees === 0,
      ).length;

    const skillsWithBenchSupply =
      rows.filter(
        (row) =>
          row.benchEmployees > 0,
      ).length;

    /*
     * Tổng employee-skill pairs.
     *
     * Ví dụ:
     * A có Java + Docker = 2 pairs.
     *
     * Không được hiểu đây là số lượng employee unique.
     */
    const employeeSkillPairs =
      rows.reduce(
        (total, row) =>
          total +
          row.totalEmployees,
        0,
      );

    const verifiedEmployeeSkillPairs =
      rows.reduce(
        (total, row) =>
          total +
          row.verifiedEmployees,
        0,
      );

    const verificationRate =
      employeeSkillPairs === 0
        ? 0
        : Number(
            (
              (
                verifiedEmployeeSkillPairs /
                employeeSkillPairs
              ) *
              100
            ).toFixed(1),
          );

    const availableSkillPairs =
      rows.reduce(
        (total, row) =>
          total +
          row.availableEmployees,
        0,
      );

    const inProjectSkillPairs =
      rows.reduce(
        (total, row) =>
          total +
          row.inProjectEmployees,
        0,
      );

    const benchSkillPairs =
      rows.reduce(
        (total, row) =>
          total +
          row.benchEmployees,
        0,
      );

    const topSupplySkills = [
      ...rows,
    ]
      .filter(
        (row) =>
          row.totalEmployees > 0,
      )
      .sort((a, b) => {
        if (
          b.totalEmployees !==
          a.totalEmployees
        ) {
          return (
            b.totalEmployees -
            a.totalEmployees
          );
        }

        return (
          b.level4Plus -
          a.level4Plus
        );
      })
      .slice(0, 5)
      .map((row) => ({
        skillId:
          row.skillId,

        name:
          row.name,

        totalEmployees:
          row.totalEmployees,

        level4Plus:
          row.level4Plus,
      }));

    /*
     * Đây là "bench opportunity",
     * KHÔNG phải skill shortage.
     *
     * Nó chỉ nói hiện đang có nguồn lực Bench
     * mang skill tương ứng.
     */
    const topBenchSkills = [
      ...rows,
    ]
      .filter(
        (row) =>
          row.benchEmployees > 0,
      )
      .sort((a, b) => {
        if (
          b.benchEmployees !==
          a.benchEmployees
        ) {
          return (
            b.benchEmployees -
            a.benchEmployees
          );
        }

        return (
          b.totalEmployees -
          a.totalEmployees
        );
      })
      .slice(0, 5)
      .map((row) => ({
        skillId:
          row.skillId,

        name:
          row.name,

        totalEmployees:
          row.totalEmployees,

        benchEmployees:
          row.benchEmployees,
      }));

    return {
      catalog: {
        totalSkills,
        skillsWithSupply,
        zeroSupplySkills,
        skillsWithBenchSupply,
      },

      coverage: {
        employeeSkillPairs,
        verifiedEmployeeSkillPairs,
        verificationRate,
      },

      workforce: {
        availableSkillPairs,
        inProjectSkillPairs,
        benchSkillPairs,
      },

      topSupplySkills,

      topBenchSkills,
    };
  }
}