export type UserSprintStatus =
  | "requested"
  | "pending_approval"
  | "assigned"
  | "released";
// frontend/src/common/types/pm.d.ts

export type EmployeeStatus = "AVAILABLE" | "IN_PROJECT" | "BENCH";
export type EvidenceStatus = "pending" | "verified" | "rejected";

export interface RequiredSkill {
  skill_id: string;
  min_level: number;
  weight: number;
}

export interface TaskItem {
  id: string;
  userId?: string;
  sprintId: string;
  requiredSkills: RequiredSkill[];
  startDate?: string;
  endDate?: string;
  budgetRate?: number;
}

export interface TaskCandidate {
  id: string;
  fullName: string;
  title: string;
  status: "available" | "bench" | "on_project";
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  costRate: number;
}

export interface UserSprintItem {
  id: string;
  sprintId: string;
  userId: string;
  percitant: number;
  status: UserSprintStatus;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface SkillEvidence {
  id: string;
  evidenceType: "certification" | "project_link" | "peer_review";
  evidenceUrl: string;
  status: EvidenceStatus;
}

// Ma trận kỹ năng của Dev
export interface UserSkill {
  id: string;
  skill: {
    id: string;
    name: string;
  };
  level: number;
  years: number;
  confidenceScore: number;
  evidences: SkillEvidence[];
}

export interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  title: string;
  status: EmployeeStatus;
  userSkills: UserSkill[];
}
