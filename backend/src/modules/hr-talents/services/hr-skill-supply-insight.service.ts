import { Injectable } from '@nestjs/common';
import { HrSkillSupplyQueryService } from './skill-supply/hr-skill-supply-query.service';



@Injectable()
export class HrSkillSupplyInsightService {
  constructor(
    private readonly skillSupplyQueryService:
      HrSkillSupplyQueryService,
  ) { }

  async getSummary() {
    const rows =
      await this.skillSupplyQueryService
        .findAll();

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
          row.workforce.bench > 0,
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
          row.workforce.available,
        0,
      );

    const inProjectSkillPairs =
      rows.reduce(
        (total, row) =>
          total +
          row.workforce.inProject,
        0,
      );

    const benchSkillPairs =
      rows.reduce(
        (total, row) =>
          total +
          row.workforce.bench,
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
          row.workforce.bench > 0,
      )
      .sort((a, b) => {
        if (
          b.workforce.bench !==
          a.workforce.bench
        ) {
          return (
            b.workforce.bench -
            a.workforce.bench
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
          row.workforce.bench,
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