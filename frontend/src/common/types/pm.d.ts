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

  title?: string;

  description?: string;

  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  status?: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";

  progress?: number;
  carryOverMeta?: {
    direction: "SOURCE" | "TARGET";

    linkedTaskId: string;

    linkedSprintId: string;

    carriedAt: string;
  } | null;
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

  employeeStatus?: string;

  currentSprintAllocationId: string | null;

  currentSprintAllocationPercent: number;

  isAssignedToSprint: boolean;

  canAssignToTask: boolean;
  sprintAllocationPercent: number;

  activeTaskCount: number;

  workloadLimit: number;

  remainingTaskSlots: number;

  workloadPercent: number;

  isAtTaskCapacity: boolean;

  isTaskOverloaded: boolean;

  activeTasks: Array<{
    id: string;

    title: string;

    status: string;

    progress: number;

    priority?: string;
  }>;
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

export interface ProjectItem {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: string;
}
export interface TaskDependencyStatus {
  taskId: string;

  totalDependencies: number;

  unfinishedDependencies: number;

  isBlockedByDependency: boolean;
}
