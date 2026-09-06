import axios from "../config/interceptor";

export interface SprintInvitationItem {
  allocationId: string;

  status: string;

  percentage: number;

  sprintId: string;

  sprintName: string;

  startDate: string | null;

  endDate: string | null;

  projectId: string | null;

  projectName: string;
}

export const devApi = {
  getMySprintInvitations: () => {
    return axios.get<IBackendRes<SprintInvitationItem[]>>(
      "/user-sprint/my-invitations",
    );
  },

  respondSprintInvitation: (
    allocationId: string,

    decision: "ACCEPT" | "DECLINE",

    reason?: string,
  ) => {
    return axios.patch<IBackendRes<any>>(
      `/user-sprint/${allocationId}/respond`,
      {
        decision,

        reason,
      },
    );
  },
};
