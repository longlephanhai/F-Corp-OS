import type {
  TalentRole,
  TalentWorkforceStatus,
} from './talent.types';

// ─────────────────────────────────────────────
// Skill Matrix
// ─────────────────────────────────────────────

export interface HrSkillMatrixWorkforce {
  available: number;
  inProject: number;
  bench: number;
}

export interface HrSkillMatrixEvidence {
  approved: number;
  pending: number;
}

export interface HrSkillMatrixItem {
  skillId: string;
  name: string;
  description: string | null;

  totalEmployees: number;
  level3Plus: number;
  level4Plus: number;

  employeesWithApprovedEvidence: number;
  verificationRate: number;

  evidence: HrSkillMatrixEvidence;

  workforce: HrSkillMatrixWorkforce;
}

export interface HrSkillMatrixResponse {
  meta: {
    currentPage: number;
    pageSize: number;
    pages: number;
    total: number;
  };

  result: HrSkillMatrixItem[];
}

export interface GetHrSkillMatrixParams {
  page?: number;
  limit?: number;
  search?: string;
}

// ─────────────────────────────────────────────
// Skill Employees
// ─────────────────────────────────────────────

export interface HrSkillEmployeeRole {
  id: string;
  name: string;
}

export interface HrSkillEmployeeInfo {
  id: string;
  fullName: string;
  email: string;
  title: string | null;

  status: TalentWorkforceStatus;

  role: HrSkillEmployeeRole | null;
}

export interface HrSkillEmployeeEvidenceSummary {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

export interface HrSkillEmployeeItem {
  userSkillId: string;

  employee: HrSkillEmployeeInfo;

  level: number;

  years: number | null;

  confidenceScore: number | null;

  hasApprovedEvidence: boolean;

  evidenceSummary:
    HrSkillEmployeeEvidenceSummary;

  updatedAt: string;
}

export interface HrSkillEmployeesResponse {
  skill: {
    id: string;
    name: string;
    description: string | null;
  };

  meta: {
    currentPage: number;
    pageSize: number;
    pages: number;
    total: number;
  };

  result: HrSkillEmployeeItem[];
}

export interface GetHrSkillEmployeesParams {
  page?: number;
  limit?: number;
  status?: TalentWorkforceStatus;
}

// ─────────────────────────────────────────────
// Skill Supply Summary
// ─────────────────────────────────────────────

export interface HrSkillSupplySummary {
  catalog: {
    totalSkills: number;
    skillsWithSupply: number;
    zeroSupplySkills: number;
    skillsWithBenchSupply: number;
  };

  coverage: {
    employeeSkillPairs: number;
    verifiedEmployeeSkillPairs: number;
    verificationRate: number;
  };

  workforce: {
    availableSkillPairs: number;
    inProjectSkillPairs: number;
    benchSkillPairs: number;
  };

  topSupplySkills: Array<{
    skillId: string;
    name: string;
    totalEmployees: number;
    level4Plus: number;
  }>;

  topBenchSkills: Array<{
    skillId: string;
    name: string;
    totalEmployees: number;
    benchEmployees: number;
  }>;
}

// ─────────────────────────────────────────────
// Skill Supply Risk
// ─────────────────────────────────────────────

export type HrSkillSupplyRiskLevel =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

export interface GetHrSkillSupplyRiskParams {
  page?: number;
  limit?: number;
  search?: string;

  riskLevel?:
    HrSkillSupplyRiskLevel;
}

export interface HrSkillSupplyRiskComponent {
  score: number;
  maxScore: number;
}

export interface HrSkillSupplyRiskItem {
  skill: {
    id: string;
    name: string;
    description: string | null;
  };

  supply: {
    totalEmployees: number;

    level3Plus: number;
    level4Plus: number;

    verifiedEmployees: number;
    verificationRate: number;

    available: number;
    inProject: number;
    bench: number;
  };

  risk: {
    score: number;

    level:
      HrSkillSupplyRiskLevel;

    components: {
      scarcity:
        HrSkillSupplyRiskComponent;

      seniorCapacity:
        HrSkillSupplyRiskComponent;

      verification:
        HrSkillSupplyRiskComponent;

      mobilization:
        HrSkillSupplyRiskComponent;
    };

    reasons: string[];
  };
}

export interface HrSkillSupplyRiskSummary {
  totalSkills: number;

  critical: number;
  high: number;
  medium: number;
  low: number;

  zeroSupply: number;
}

export interface HrSkillSupplyRiskResponse {
  summary:
    HrSkillSupplyRiskSummary;

  meta: {
    currentPage: number;
    pageSize: number;
    pages: number;
    total: number;
  };

  result:
    HrSkillSupplyRiskItem[];
}

// ─────────────────────────────────────────────
// Talent Data Quality
// ─────────────────────────────────────────────

export interface GetHrTalentDataQualityParams {
  role?: string;
  staleDays?: number;
}

export interface HrTalentDataQualityEmployee {
  id: string;
  fullName: string;
  email: string;
  title: string | null;

  status: TalentWorkforceStatus;

  role: TalentRole | null;
}

export interface HrTalentDataQualityItem {
  employee:
    HrTalentDataQualityEmployee;

  quality: {
    totalSkills: number;
    totalEvidences: number;

    approvedEvidences: number;
    pendingEvidences: number;
    rejectedEvidences: number;

    hasSkills: boolean;
    hasApprovedEvidence: boolean;
    hasPendingEvidence: boolean;

    isStale: boolean;

    lastTalentDataUpdatedAt:
      | string
      | null;
  };
}

export interface HrTalentDataQualityResponse {
  criteria: {
    role: string | null;

    staleDays: number;

    staleBefore: string;
  };

  summary: {
    totalEmployees: number;

    employeesWithSkills: number;
    employeesWithoutSkills: number;

    employeesWithApprovedEvidence: number;
    employeesWithoutApprovedEvidence: number;

    employeesWithPendingEvidence: number;

    totalPendingEvidences: number;

    staleProfiles: number;

    skillCoverageRate: number;
    evidenceCoverageRate: number;
    freshnessRate: number;
  };

  issues: {
    withoutSkills:
      HrTalentDataQualityItem[];

    withoutApprovedEvidence:
      HrTalentDataQualityItem[];

    pendingEvidence:
      HrTalentDataQualityItem[];

    staleProfiles:
      HrTalentDataQualityItem[];
  };
}