export enum HrSkillSupplyRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface HrSkillSupplyRiskComponent {
  score: number;

  maxScore: number;
}

export interface HrSkillSupplyRiskAssessment {
  score: number;

  level: HrSkillSupplyRiskLevel;

  components: {
    scarcity: HrSkillSupplyRiskComponent;

    seniorCapacity: HrSkillSupplyRiskComponent;

    verification: HrSkillSupplyRiskComponent;

    mobilization: HrSkillSupplyRiskComponent;
  };

  reasons: string[];
}

export interface HrSkillSupplyRiskInput {
  totalEmployees: number;

  level4Plus: number;

  verificationRate: number;

  availableEmployees: number;

  benchEmployees: number;
}