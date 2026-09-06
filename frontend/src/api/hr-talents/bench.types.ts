import type {
  TalentRole,
  TalentWorkforceStatus,
} from './talent.types';

// ─────────────────────────────────────────────
// Bench Talent Pool
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// Bench Readiness
// ─────────────────────────────────────────────

export type HrBenchReadinessStatus =
  | 'READY'
  | 'PARTIALLY_READY'
  | 'NEEDS_VERIFICATION'
  | 'NEEDS_PROFILE_UPDATE';

export interface GetHrBenchReadinessParams
  extends GetHrBenchTalentsParams {
  staleDays?: number;
}

export interface HrBenchReadinessSkillComponent {
  score: number;
  maxScore: 35;

  skillCount: number;

  averageTopLevel: number;
}

export interface HrBenchReadinessEvidenceComponent {
  score: number;
  maxScore: 30;

  coverageRate: number;
}

export interface HrBenchReadinessPerformanceComponent {
  score: number;
  maxScore: 20;

  latestFinalScore: number | null;

  hasCompletedReview: boolean;
}

export interface HrBenchReadinessFreshnessComponent {
  score: number;
  maxScore: 15;

  daysSinceUpdate: number | null;

  isStale: boolean;
}

export interface HrBenchReadiness {
  score: number;

  status:
    HrBenchReadinessStatus;

  components: {
    skill:
      HrBenchReadinessSkillComponent;

    evidence:
      HrBenchReadinessEvidenceComponent;

    performance:
      HrBenchReadinessPerformanceComponent;

    freshness:
      HrBenchReadinessFreshnessComponent;
  };

  strengths: string[];

  issues: string[];
}

export interface HrBenchReadinessItem
  extends HrBenchTalentItem {
  readiness:
    HrBenchReadiness;
}

export interface HrBenchReadinessResponse {
  criteria: {
    status: string;

    search: string | null;
    role: string | null;

    skillId: string | null;

    minLevel: number | null;

    verified: boolean;

    staleDays: number;
  };

  meta: {
    currentPage: number;
    pageSize: number;
    pages: number;
    total: number;
  };

  result:
    HrBenchReadinessItem[];
}

/**
 * Bench Readiness endpoint hiện có thêm
 * một lớp data riêng ở backend.
 */
export interface HrBenchReadinessApiResponse {
  message: string;

  data:
    HrBenchReadinessResponse;
}