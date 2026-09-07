export type PmActionCategory =
  | 'CRITICAL'
  | 'APPROVAL'
  | 'RESOURCE'
  | 'MONITORING';

export type PmActionSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type PmActionType =
  | 'OVERDUE_TASK'
  | 'BLOCKED_TASK'
  | 'CRITICAL_TASK'
  | 'UNASSIGNED_TASK'
  | 'ALLOCATION_NOT_SENT'
  | 'ALLOCATION_PENDING'
  | 'ALLOCATION_DECLINED'
  | 'SPRINT_NOT_READY';

export interface PmActionCenterItem {
  id: string;

  type: PmActionType;

  category: PmActionCategory;

  severity: PmActionSeverity;

  title: string;

  description: string;

  projectId: string;

  projectName: string;

  sprintId?: string | null;

  sprintName?: string | null;

  taskId?: string | null;

  allocationId?: string | null;

  userId?: string | null;

  dueDate?: string | Date | null;

  actionLabel: string;
}

export interface PmActionCenterResult {
  generatedAt: string;

  summary: {
    totalActions: number;

    critical: number;

    approvals: number;

    resourceIssues: number;

    monitoring: number;

    managedProjects: number;

    activeSprints: number;

    upcomingSprints: number;
  };

  items: PmActionCenterItem[];
}
