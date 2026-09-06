import { useEffect } from "react";

import { notification } from "antd";

import { socket } from "../../config/socket";

interface SprintAllocationInvitationEvent {
  type: "SPRINT_ALLOCATION_INVITATION";

  allocationId: string;

  sprintId: string;

  sprintName: string;

  projectId: string;

  projectName: string;

  percentage: number;

  startDate: string | null;

  endDate: string | null;

  status: "PENDING_APPROVAL";

  occurredAt: string;
}

export const SprintInvitationSocketListener = () => {
  const [notificationApi, contextHolder] = notification.useNotification();

  useEffect(() => {
    const handleInvitation = (event: SprintAllocationInvitationEvent) => {
      console.log("[Sprint Invitation] Received:", event);

      notificationApi.info({
        message: "Lời mời tham gia Sprint",

        description:
          `${event.projectName} • ` +
          `${event.sprintName} • ` +
          `${event.percentage}% công suất`,

        placement: "topRight",

        duration: 0,
      });
    };

    socket.on("sprint_allocation_invitation", handleInvitation);

    return () => {
      socket.off("sprint_allocation_invitation", handleInvitation);
    };
  }, [notificationApi]);

  return contextHolder;
};
