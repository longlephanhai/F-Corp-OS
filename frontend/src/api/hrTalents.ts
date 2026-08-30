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
};