export type UserSprintStatus = 'requested' | 'pending_approval' | 'assigned' | 'released';
// frontend/src/common/types/pm.d.ts

export type EmployeeStatus = 'available' | 'on_project' | 'bench'; [cite: 1642, 1682]
export type EvidenceStatus = 'pending' | 'verified' | 'rejected'; [cite: 1642, 1682]


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
  id: string; [cite: 1642, 1682]
  evidenceType: 'certification' | 'project_link' | 'peer_review'; [cite: 1642, 1682]
  evidenceUrl: string; [cite: 1642, 1682]
  status: EvidenceStatus; [cite: 1642, 1682]
}

// Ma trận kỹ năng của Dev 
export interface UserSkill {
  id: string; [cite: 1642, 1682]
  skill: { 
    id: string; [cite: 1642, 1682]
    name: string; [cite: 1642, 1682]
  }; [cite: 1642, 1682]
  level: number; [cite: 1642, 1682]
  years: number; [cite: 1642, 1682]
  confidenceScore: number; [cite: 1642, 1674, 1682]
  evidences: SkillEvidence[]; [cite: 1642, 1674, 1682]
}

export interface TeamMember {
  id: string; [cite: 1642, 1682]
  fullName: string; [cite: 1642, 1682]
  email: string; [cite: 1642, 1682]
  title: string; [cite: 1642, 1682]
  status: EmployeeStatus; [cite: 1642, 1682]
  userSkills: UserSkill[]; [cite: 1642, 1682]
}