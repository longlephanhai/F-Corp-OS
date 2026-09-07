import axios from "../config/interceptor";

export type PmActionCategory =
  | "CRITICAL"
  | "APPROVAL"
  | "RESOURCE"
  | "MONITORING";

export type PmActionSeverity =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW";

export interface PmActionCenterItem {
  id: string;

  type: string;

  category:
    PmActionCategory;

  severity:
    PmActionSeverity;

  title:
    string;

  description:
    string;

  projectId:
    string;

  projectName:
    string;

  sprintId?:
    string | null;

  sprintName?:
    string | null;

  taskId?:
    string | null;

  allocationId?:
    string | null;

  userId?:
    string | null;

  dueDate?:
    string | null;

  actionLabel:
    string;
}

export interface PmActionCenterData {
  generatedAt:
    string;

  summary: {
    totalActions:
      number;

    critical:
      number;

    approvals:
      number;

    resourceIssues:
      number;

    monitoring:
      number;

    managedProjects:
      number;

    activeSprints:
      number;

    upcomingSprints:
      number;
  };

  items:
    PmActionCenterItem[];
}

export const pmActionCenterApi = {
  getActionCenter:
    () =>
      axios.get<
        IBackendRes<
          PmActionCenterData
        >
      >(
        "/pm-action-center",
      ),
};