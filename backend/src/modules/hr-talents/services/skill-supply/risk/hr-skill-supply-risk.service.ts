import {
  Injectable,
} from '@nestjs/common';

import {
  GetHrSkillSupplyRiskDto,
} from '../../../dto/get-hr-skill-supply-risk.dto';

import {
  HrSkillSupplyQueryService,
} from '../hr-skill-supply-query.service';

import {
  scoreHrSkillSupplyRisk,
} from './hr-skill-supply-risk.scorer';

import {
  HrSkillSupplyRiskLevel,
} from './hr-skill-supply-risk.types';

@Injectable()
export class HrSkillSupplyRiskService {
  constructor(
    private readonly skillSupplyQueryService:
      HrSkillSupplyQueryService,
  ) {}

  async getRiskAnalysis(
    query:
      GetHrSkillSupplyRiskDto,
  ) {
    const {
      page = 1,
      limit = 20,
      search,
      riskLevel,
    } = query;

    /*
     * Risk phải được tính trên toàn bộ
     * tập skill trước khi pagination.
     *
     * Nếu paginate trước rồi mới score,
     * summary và filter riskLevel sẽ sai.
     */
    const supply =
      await this.skillSupplyQueryService
        .findAll(
          search,
        );

    const assessed =
      supply.map(
        (skill) => {
          const risk =
            scoreHrSkillSupplyRisk({
              totalEmployees:
                skill.totalEmployees,

              level4Plus:
                skill.level4Plus,

              verificationRate:
                skill.verificationRate,

              availableEmployees:
                skill.workforce.available,

              benchEmployees:
                skill.workforce.bench,
            });

          return {
            skill: {
              id:
                skill.skillId,

              name:
                skill.name,

              description:
                skill.description,
            },

            supply: {
              totalEmployees:
                skill.totalEmployees,

              level3Plus:
                skill.level3Plus,

              level4Plus:
                skill.level4Plus,

              verifiedEmployees:
                skill.verifiedEmployees,

              verificationRate:
                skill.verificationRate,

              available:
                skill.workforce.available,

              inProject:
                skill.workforce.inProject,

              bench:
                skill.workforce.bench,
            },

            risk,
          };
        },
      );

    /*
     * Summary phản ánh toàn bộ tập skill
     * sau search nhưng trước riskLevel filter.
     *
     * Nhờ vậy khi HR chọn HIGH, họ vẫn thấy
     * bức tranh tổng thể LOW/MEDIUM/HIGH/CRITICAL.
     */
    const summary =
      this.buildSummary(
        assessed,
      );

    const filtered =
      riskLevel
        ? assessed.filter(
            (item) =>
              item.risk.level ===
              riskLevel,
          )
        : assessed;

    /*
     * Rủi ro cao nhất hiển thị trước.
     *
     * Nếu bằng điểm:
     * 1. skill ít người hơn lên trước;
     * 2. cuối cùng sort theo tên.
     */
    filtered.sort(
      (a, b) => {
        if (
          b.risk.score !==
          a.risk.score
        ) {
          return (
            b.risk.score -
            a.risk.score
          );
        }

        if (
          a.supply.totalEmployees !==
          b.supply.totalEmployees
        ) {
          return (
            a.supply.totalEmployees -
            b.supply.totalEmployees
          );
        }

        return a.skill.name
          .localeCompare(
            b.skill.name,
          );
      },
    );

    const total =
      filtered.length;

    const skip =
      (page - 1) * limit;

    const result =
      filtered.slice(
        skip,
        skip + limit,
      );

    return {
      summary,

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

      result,
    };
  }

  private buildSummary(
    items: Array<{
      supply: {
        totalEmployees:
          number;
      };

      risk: {
        level:
          HrSkillSupplyRiskLevel;
      };
    }>,
  ) {
    return {
      totalSkills:
        items.length,

      critical:
        items.filter(
          (item) =>
            item.risk.level ===
            HrSkillSupplyRiskLevel.CRITICAL,
        ).length,

      high:
        items.filter(
          (item) =>
            item.risk.level ===
            HrSkillSupplyRiskLevel.HIGH,
        ).length,

      medium:
        items.filter(
          (item) =>
            item.risk.level ===
            HrSkillSupplyRiskLevel.MEDIUM,
        ).length,

      low:
        items.filter(
          (item) =>
            item.risk.level ===
            HrSkillSupplyRiskLevel.LOW,
        ).length,

      zeroSupply:
        items.filter(
          (item) =>
            item.supply.totalEmployees ===
            0,
        ).length,
    };
  }
}