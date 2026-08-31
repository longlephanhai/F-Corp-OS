import axios from '../config/interceptor';

// ─────────────────────────────────────────────────────────────────────────────
// Common types
// ─────────────────────────────────────────────────────────────────────────────

export type TalentWorkforceStatus =
  | 'AVAILABLE'
  | 'IN_PROJECT'
  | 'BENCH';

export type TalentEvidenceStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export interface TalentRole {
  id: string;
  name: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Talent Directory
// GET /hr-talents
// ─────────────────────────────────────────────────────────────────────────────

export interface TalentTopSkill {
  userSkillId: string;
  skillId: string;
  name: string;
  level: number;
  years: number | null;
  confidenceScore: number | null;
  approvedEvidenceCount: number;
  pendingEvidenceCount: number;
}

export interface TalentSkillSummary {
  totalSkills: number;
  skillsWithApprovedEvidence: number;
  totalEvidences: number;
  approvedEvidences: number;
  pendingEvidences: number;
  rejectedEvidences: number;
}

export interface TalentDirectoryItem {
  id: string;
  fullName: string;
  email: string;
  title: string | null;
  status: TalentWorkforceStatus;

  role: TalentRole | null;

  skillSummary: TalentSkillSummary;

  topSkills: TalentTopSkill[];
}

export interface TalentDirectoryResponse {
  meta: {
    currentPage: number;
    pageSize: number;
    pages: number;
    total: number;
  };

  result: TalentDirectoryItem[];
}

export interface GetHrTalentsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: TalentWorkforceStatus;
  role?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Employee Talent Profile
// GET /hr-talents/:employeeId
// ─────────────────────────────────────────────────────────────────────────────

export interface TalentManager {
  id: string;
  fullName: string;
  email: string;
}

export interface TalentEmployee {
  id: string;
  fullName: string;
  email: string;
  title: string | null;
  status: TalentWorkforceStatus;
  role: TalentRole | null;
  manager: TalentManager | null;
}

export interface TalentEvidence {
  id: string;
  type: string;
  title: string | null;
  url: string | null;
  description: string | null;
  status: TalentEvidenceStatus;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TalentSkillEvidenceSummary {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

export interface TalentSkill {
  userSkillId: string;

  skill: {
    id: string;
    name: string;
  };

  description: string | null;

  level: number;

  years: number | null;

  confidenceScore: number | null;

  evidenceNote: string | null;

  hasApprovedEvidence: boolean;

  evidenceSummary: TalentSkillEvidenceSummary;

  evidences: TalentEvidence[];

  updatedAt: string;
}

export interface TalentProfileSummary {
  totalSkills: number;
  skillsWithApprovedEvidence: number;
  totalEvidences: number;
  approvedEvidences: number;
  pendingEvidences: number;
  rejectedEvidences: number;
  lastTalentDataUpdatedAt: string | null;
}

export interface TalentReviewCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface TalentPerformanceHistoryItem {
  id: string;
  status: string;
  tempScore: number | null;
  finalScore: number | null;
  reviewerNote: string | null;

  reviewCycle: TalentReviewCycle | null;

  createdAt: string;
  updatedAt: string;
}

export interface TalentPerformanceSummary {
  totalReviews: number;
  completedReviews: number;
  averageFinalScore: number | null;
  latestFinalScore: number | null;

  latestReviewCycle: {
    id: string;
    name: string;
  } | null;
}

export interface EmployeeTalentProfile {
  employee: TalentEmployee;

  talentSummary: TalentProfileSummary;

  skills: TalentSkill[];

  performanceSummary: TalentPerformanceSummary;

  performanceHistory: TalentPerformanceHistoryItem[];
}


// ─────────────────────────────────────────────────────────────────────────────
// Skill Matrix
// GET /hr-talents/analytics/skill-matrix
// ─────────────────────────────────────────────────────────────────────────────

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

  evidenceSummary: HrSkillEmployeeEvidenceSummary;

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

// ─────────────────────────────────────────────────────────────────────────────
// Talent Data Quality
// GET /hr-talents/analytics/data-quality
// ─────────────────────────────────────────────────────────────────────────────

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
  employee: HrTalentDataQualityEmployee;

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

// ─────────────────────────────────────────────────────────────────────────────
// Bench Talent Pool
// GET /hr-talents/bench
// ─────────────────────────────────────────────────────────────────────────────

export interface GetHrBenchTalentsParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  skillId?: string;
  minLevel?: number;
  verified?: boolean;
}

export interface HrBenchTalentSkill {
  userSkillId: string;

  skillId: string;

  name: string;

  level: number;

  years: number | null;

  confidenceScore: number | null;

  hasApprovedEvidence: boolean;

  approvedEvidenceCount: number;

  pendingEvidenceCount: number;
}

export interface HrBenchTalentSkillSummary {
  totalSkills: number;

  skillsWithApprovedEvidence: number;

  totalEvidences: number;

  approvedEvidences: number;

  pendingEvidences: number;

  rejectedEvidences: number;

  evidenceCoverageRate: number;
}

export interface HrBenchTalentPerformance {
  latestFinalScore: number | null;

  latestReviewCycle: {
    id: string;
    name: string;
  } | null;

  reviewedAt: string | null;
}

export interface HrBenchTalentItem {
  employee: {
    id: string;

    fullName: string;

    email: string;

    title: string | null;

    status: TalentWorkforceStatus;

    role: TalentRole | null;
  };

  skillSummary:
  HrBenchTalentSkillSummary;

  topSkills:
  HrBenchTalentSkill[];

  performance:
  HrBenchTalentPerformance;

  lastTalentDataUpdatedAt:
  string | null;
}

export interface HrBenchTalentsResponse {
  criteria: {
    status: 'BENCH';

    search: string | null;

    role: string | null;

    skillId: string | null;

    minLevel: number | null;

    verified: boolean;
  };

  meta: {
    currentPage: number;

    pageSize: number;

    pages: number;

    total: number;
  };

  result:
  HrBenchTalentItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────
export const hrTalentsApi = {
  getAll: (
    params?: GetHrTalentsParams,
  ): Promise<
    IBackendRes<TalentDirectoryResponse>
  > => {
    return axios.get<
      IBackendRes<TalentDirectoryResponse>
    >(
      '/hr-talents',
      {
        params,
      },
    ) as unknown as Promise<
      IBackendRes<TalentDirectoryResponse>
    >;
  },

  getByEmployeeId: (
    employeeId: string,
  ): Promise<
    IBackendRes<EmployeeTalentProfile>
  > => {
    return axios.get<
      IBackendRes<EmployeeTalentProfile>
    >(
      `/hr-talents/${employeeId}`,
    ) as unknown as Promise<
      IBackendRes<EmployeeTalentProfile>
    >;
  },

  getSkillMatrix: (
    params?: GetHrSkillMatrixParams,
  ): Promise<IBackendRes<HrSkillMatrixResponse>> => {
    return axios.get<
      IBackendRes<HrSkillMatrixResponse>
    >(
      '/hr-talents/analytics/skill-matrix',
      {
        params,
      },
    ) as unknown as Promise<
      IBackendRes<HrSkillMatrixResponse>
    >;
  },

  getSkillEmployees: (
    skillId: string,
    params?: GetHrSkillEmployeesParams,
  ): Promise<IBackendRes<HrSkillEmployeesResponse>> => {
    return axios.get<
      IBackendRes<HrSkillEmployeesResponse>
    >(
      `/hr-talents/analytics/skills/${skillId}/employees`,
      {
        params,
      },
    ) as unknown as Promise<
      IBackendRes<HrSkillEmployeesResponse>
    >;
  },

  getSkillSupplySummary:
    (): Promise<
      IBackendRes<HrSkillSupplySummary>
    > => {
      return axios.get<
        IBackendRes<HrSkillSupplySummary>
      >(
        '/hr-talents/analytics/skill-supply-summary',
      ) as unknown as Promise<
        IBackendRes<HrSkillSupplySummary>
      >;
    },

  getTalentDataQuality: (
    params?: GetHrTalentDataQualityParams,
  ): Promise<
    IBackendRes<HrTalentDataQualityResponse>
  > => {
    return axios.get<
      IBackendRes<HrTalentDataQualityResponse>
    >(
      '/hr-talents/analytics/data-quality',
      {
        params,
      },
    ) as unknown as Promise<
      IBackendRes<HrTalentDataQualityResponse>
    >;
  },

  getBenchTalents: (
    params?: GetHrBenchTalentsParams,
  ): Promise<
    IBackendRes<HrBenchTalentsResponse>
  > => {
    return axios.get<
      IBackendRes<HrBenchTalentsResponse>
    >(
      '/hr-talents/bench',
      {
        params,
      },
    ) as unknown as Promise<
      IBackendRes<HrBenchTalentsResponse>
    >;
  },
};