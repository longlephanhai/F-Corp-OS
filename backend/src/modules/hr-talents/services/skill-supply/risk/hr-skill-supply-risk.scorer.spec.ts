import {
  scoreHrSkillSupplyRisk,
} from './hr-skill-supply-risk.scorer';

import {
  HrSkillSupplyRiskLevel,
} from './hr-skill-supply-risk.types';

describe(
  'scoreHrSkillSupplyRisk',
  () => {
    it(
      'marks zero supply as CRITICAL',
      () => {
        const result =
          scoreHrSkillSupplyRisk({
            totalEmployees: 0,
            level4Plus: 0,
            verificationRate: 0,
            availableEmployees: 0,
            benchEmployees: 0,
          });

        expect(
          result.score,
        ).toBe(100);

        expect(
          result.level,
        ).toBe(
          HrSkillSupplyRiskLevel.CRITICAL,
        );

        expect(
          result.reasons,
        ).toContain(
          'Chưa có nhân sự nào sở hữu kỹ năng này.',
        );
      },
    );

    it(
      'never rates a single-person supply below HIGH',
      () => {
        const result =
          scoreHrSkillSupplyRisk({
            totalEmployees: 1,
            level4Plus: 1,
            verificationRate: 100,
            availableEmployees: 1,
            benchEmployees: 0,
          });

        expect(
          result.level,
        ).toBe(
          HrSkillSupplyRiskLevel.HIGH,
        );

        expect(
          result.reasons.some(
            (reason) =>
              reason.includes(
                'phụ thuộc vào một cá nhân',
              ),
          ),
        ).toBe(true);
      },
    );

    it(
      'rates thin and unavailable supply as HIGH',
      () => {
        const result =
          scoreHrSkillSupplyRisk({
            totalEmployees: 2,
            level4Plus: 1,
            verificationRate: 50,
            availableEmployees: 0,
            benchEmployees: 0,
          });

        expect(
          result.score,
        ).toBe(70);

        expect(
          result.level,
        ).toBe(
          HrSkillSupplyRiskLevel.HIGH,
        );
      },
    );

    it(
      'reduces verification risk when evidence coverage is strong',
      () => {
        const result =
          scoreHrSkillSupplyRisk({
            totalEmployees: 4,
            level4Plus: 2,
            verificationRate: 100,
            availableEmployees: 1,
            benchEmployees: 1,
          });

        expect(
          result.components
            .verification.score,
        ).toBe(0);
      },
    );

    it(
      'rates healthy diversified supply as LOW',
      () => {
        const result =
          scoreHrSkillSupplyRisk({
            totalEmployees: 6,
            level4Plus: 3,
            verificationRate: 100,
            availableEmployees: 1,
            benchEmployees: 1,
          });

        expect(
          result.score,
        ).toBe(0);

        expect(
          result.level,
        ).toBe(
          HrSkillSupplyRiskLevel.LOW,
        );
      },
    );

    it(
      'clamps invalid verification rate into 0-100 range',
      () => {
        const over =
          scoreHrSkillSupplyRisk({
            totalEmployees: 6,
            level4Plus: 3,
            verificationRate: 120,
            availableEmployees: 2,
            benchEmployees: 0,
          });

        expect(
          over.components
            .verification.score,
        ).toBe(0);

        const under =
          scoreHrSkillSupplyRisk({
            totalEmployees: 6,
            level4Plus: 3,
            verificationRate: -20,
            availableEmployees: 2,
            benchEmployees: 0,
          });

        expect(
          under.components
            .verification.score,
        ).toBe(20);
      },
    );
  },
);