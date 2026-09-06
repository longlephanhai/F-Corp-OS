import {
  HrSkillSupplyRiskAssessment,
  HrSkillSupplyRiskInput,
  HrSkillSupplyRiskLevel,
} from './hr-skill-supply-risk.types';

function getScarcityScore(
  totalEmployees: number,
): number {
  if (totalEmployees <= 0) {
    return 40;
  }

  if (totalEmployees === 1) {
    return 35;
  }

  if (totalEmployees === 2) {
    return 30;
  }

  if (totalEmployees === 3) {
    return 20;
  }

  if (totalEmployees <= 5) {
    return 10;
  }

  return 0;
}

function getSeniorCapacityScore(
  level4Plus: number,
): number {
  if (level4Plus <= 0) {
    return 25;
  }

  if (level4Plus === 1) {
    return 15;
  }

  if (level4Plus === 2) {
    return 8;
  }

  return 0;
}

function getVerificationScore(
  verificationRate: number,
): number {
  const normalizedRate =
    Math.min(
      100,
      Math.max(
        0,
        verificationRate,
      ),
    );

  return Number(
    (
      (
        100 -
        normalizedRate
      ) /
      100 *
      20
    ).toFixed(1),
  );
}

function getMobilizationScore(
  availableEmployees: number,
  benchEmployees: number,
): number {
  const mobilizableEmployees =
    availableEmployees +
    benchEmployees;

  if (
    mobilizableEmployees <= 0
  ) {
    return 15;
  }

  if (
    mobilizableEmployees === 1
  ) {
    return 8;
  }

  return 0;
}

function resolveRiskLevel(
  score: number,
): HrSkillSupplyRiskLevel {
  if (score >= 75) {
    return HrSkillSupplyRiskLevel.CRITICAL;
  }

  if (score >= 50) {
    return HrSkillSupplyRiskLevel.HIGH;
  }

  if (score >= 25) {
    return HrSkillSupplyRiskLevel.MEDIUM;
  }

  return HrSkillSupplyRiskLevel.LOW;
}

function applyHardGate(
  calculatedLevel:
    HrSkillSupplyRiskLevel,
  totalEmployees: number,
): HrSkillSupplyRiskLevel {
  /*
   * Không có bất kỳ nhân sự nào sở hữu skill:
   * rủi ro nguồn cung luôn NGHIÊM TRỌNG.
   */
  if (totalEmployees <= 0) {
    return HrSkillSupplyRiskLevel.CRITICAL;
  }

  /*
   * Chỉ có một nhân sự:
   * doanh nghiệp đang có single point
   * of dependency.
   *
   * Không cho phép đánh giá thấp hơn HIGH.
   */
  if (
    totalEmployees === 1 &&
    (
      calculatedLevel ===
        HrSkillSupplyRiskLevel.LOW ||
      calculatedLevel ===
        HrSkillSupplyRiskLevel.MEDIUM
    )
  ) {
    return HrSkillSupplyRiskLevel.HIGH;
  }

  return calculatedLevel;
}

function buildReasons(
  input: HrSkillSupplyRiskInput,
): string[] {
  const reasons: string[] = [];

  if (input.totalEmployees <= 0) {
    reasons.push(
      'Chưa có nhân sự nào sở hữu kỹ năng này.',
    );

    return reasons;
  }

  if (input.totalEmployees === 1) {
    reasons.push(
      'Chỉ có 1 nhân sự sở hữu kỹ năng, tạo rủi ro phụ thuộc vào một cá nhân.',
    );
  } else if (
    input.totalEmployees <= 3
  ) {
    reasons.push(
      `Nguồn cung kỹ năng còn mỏng, hiện chỉ có ${input.totalEmployees} nhân sự.`,
    );
  }

  if (input.level4Plus <= 0) {
    reasons.push(
      'Chưa có nhân sự đạt cấp độ 4 trở lên.',
    );
  } else if (
    input.level4Plus === 1
  ) {
    reasons.push(
      'Chỉ có 1 nhân sự đạt cấp độ 4 trở lên.',
    );
  }

  if (
    input.verificationRate === 0
  ) {
    reasons.push(
      'Chưa có hồ sơ năng lực được xác minh bằng minh chứng đã duyệt.',
    );
  } else if (
    input.verificationRate < 50
  ) {
    reasons.push(
      'Tỷ lệ nhân sự có minh chứng được duyệt còn thấp.',
    );
  }

  const mobilizableEmployees =
    input.availableEmployees +
    input.benchEmployees;

  if (mobilizableEmployees === 0) {
    reasons.push(
      'Hiện không có nguồn lực Bench hoặc sẵn sàng để điều động.',
    );
  } else if (
    mobilizableEmployees === 1
  ) {
    reasons.push(
      'Nguồn lực có thể cân nhắc điều động hiện chỉ có 1 nhân sự.',
    );
  }

  return reasons;
}

export function scoreHrSkillSupplyRisk(
  input: HrSkillSupplyRiskInput,
): HrSkillSupplyRiskAssessment {
  const scarcityScore =
    getScarcityScore(
      input.totalEmployees,
    );

  const seniorCapacityScore =
    getSeniorCapacityScore(
      input.level4Plus,
    );

  const verificationScore =
    getVerificationScore(
      input.verificationRate,
    );

  const mobilizationScore =
    getMobilizationScore(
      input.availableEmployees,
      input.benchEmployees,
    );

  const score =
    Number(
      (
        scarcityScore +
        seniorCapacityScore +
        verificationScore +
        mobilizationScore
      ).toFixed(1),
    );

  const calculatedLevel =
    resolveRiskLevel(
      score,
    );

  const level =
    applyHardGate(
      calculatedLevel,
      input.totalEmployees,
    );

  return {
    score,

    level,

    components: {
      scarcity: {
        score:
          scarcityScore,

        maxScore: 40,
      },

      seniorCapacity: {
        score:
          seniorCapacityScore,

        maxScore: 25,
      },

      verification: {
        score:
          verificationScore,

        maxScore: 20,
      },

      mobilization: {
        score:
          mobilizationScore,

        maxScore: 15,
      },
    },

    reasons:
      buildReasons(
        input,
      ),
  };
}