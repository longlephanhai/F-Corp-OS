export type UserSprintStatus = 'requested' | 'pending_approval' | 'assigned' | 'released';

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