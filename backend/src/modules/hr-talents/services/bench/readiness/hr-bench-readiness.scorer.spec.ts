import {
  scoreBenchReadiness,
} from './hr-bench-readiness.scorer';

const daysAgo = (
  days: number,
) =>
  new Date(
    Date.now() -
      days *
        24 *
        60 *
        60 *
        1000,
  );

describe(
  'scoreBenchReadiness',
  () => {
    it(
      'should return READY for a strong and fresh Bench profile',
      () => {
        const result =
          scoreBenchReadiness(
            {
              skillSummary: {
                totalSkills: 4,
                skillsWithApprovedEvidence: 4,
                evidenceCoverageRate: 100,
              },

              topSkills: [
                { level: 5 },
                { level: 4 },
                { level: 4 },
                { level: 3 },
              ],

              performance: {
                latestFinalScore: 93,
              },

              lastTalentDataUpdatedAt:
                daysAgo(7),
            },
            90,
          );

        expect(
          result.status,
        ).toBe(
          'READY',
        );

        expect(
          result.score,
        ).toBeGreaterThanOrEqual(
          80,
        );

        expect(
          result.components
            .freshness.isStale,
        ).toBe(false);
      },
    );

    it(
      'should return PARTIALLY_READY when profile passes hard gates but score is below 80',
      () => {
        const result =
          scoreBenchReadiness(
            {
              skillSummary: {
                totalSkills: 3,
                skillsWithApprovedEvidence: 2,
                evidenceCoverageRate: 66.7,
              },

              topSkills: [
                { level: 4 },
                { level: 3 },
                { level: 3 },
              ],

              performance: {
                latestFinalScore: 84.5,
              },

              lastTalentDataUpdatedAt:
                daysAgo(40),
            },
            90,
          );

        expect(
          result.status,
        ).toBe(
          'PARTIALLY_READY',
        );

        expect(
          result.score,
        ).toBeLessThan(
          80,
        );

        expect(
          result.components
            .freshness.isStale,
        ).toBe(false);
      },
    );

    it(
      'should prioritize NEEDS_VERIFICATION when employee has skills but no approved evidence',
      () => {
        const result =
          scoreBenchReadiness(
            {
              skillSummary: {
                totalSkills: 2,
                skillsWithApprovedEvidence: 0,
                evidenceCoverageRate: 0,
              },

              topSkills: [
                { level: 2 },
                { level: 2 },
              ],

              performance: {
                latestFinalScore: null,
              },

              lastTalentDataUpdatedAt:
                daysAgo(120),
            },
            90,
          );

        expect(
          result.status,
        ).toBe(
          'NEEDS_VERIFICATION',
        );
      },
    );

    it(
      'should return NEEDS_PROFILE_UPDATE when employee has no skills',
      () => {
        const result =
          scoreBenchReadiness(
            {
              skillSummary: {
                totalSkills: 0,
                skillsWithApprovedEvidence: 0,
                evidenceCoverageRate: 0,
              },

              topSkills: [],

              performance: {
                latestFinalScore: null,
              },

              lastTalentDataUpdatedAt:
                daysAgo(130),
            },
            90,
          );

        expect(
          result.status,
        ).toBe(
          'NEEDS_PROFILE_UPDATE',
        );

        expect(
          result.issues,
        ).toContain(
          'Chưa có kỹ năng trong hồ sơ năng lực',
        );
      },
    );

    it(
      'should return NEEDS_PROFILE_UPDATE when Talent Profile is stale',
      () => {
        const result =
          scoreBenchReadiness(
            {
              skillSummary: {
                totalSkills: 3,
                skillsWithApprovedEvidence: 2,
                evidenceCoverageRate: 66.7,
              },

              topSkills: [
                { level: 4 },
                { level: 4 },
                { level: 3 },
              ],

              performance: {
                latestFinalScore: 88,
              },

              lastTalentDataUpdatedAt:
                daysAgo(91),
            },
            90,
          );

        expect(
          result.status,
        ).toBe(
          'NEEDS_PROFILE_UPDATE',
        );

        expect(
          result.components
            .freshness.isStale,
        ).toBe(true);
      },
    );
  },
);