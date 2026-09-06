import { Injectable } from '@nestjs/common';

import { NotificationsService } from '../notifications/notifications.service';

import { NotificationsGateway } from '../notifications/notifications.gateway';

export interface SendSprintAllocationInvitationInput {
  userId: string;

  allocationId: string;

  sprintId: string;

  sprintName: string;

  projectId: string;

  projectName: string;

  percentage: number;

  startDate?: Date | null;

  endDate?: Date | null;
}

@Injectable()
export class SprintAllocationInvitationService {
  constructor(
    private readonly notificationsService: NotificationsService,

    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async send(input: SendSprintAllocationInvitationInput) {
    const payload = {
      type: 'SPRINT_ALLOCATION_INVITATION',

      allocationId: input.allocationId,

      sprintId: input.sprintId,

      sprintName: input.sprintName,

      projectId: input.projectId,

      projectName: input.projectName,

      percentage: input.percentage,

      startDate: input.startDate ?? null,

      endDate: input.endDate ?? null,

      status: 'PENDING_APPROVAL',

      occurredAt: new Date().toISOString(),
    };

    // ========================================
    // PERSISTED NOTIFICATION
    //
    // Notification lỗi không được làm allocation
    // business transaction thất bại.
    // ========================================

    try {
      await this.notificationsService.createForUser({
        userId: input.userId,

        title: 'Lời mời tham gia Sprint',

        description:
          `Bạn được mời tham gia ${input.sprintName} ` +
          `của ${input.projectName} với ${input.percentage}% công suất.`,

        type: 'info',
      });
    } catch (error) {
      console.error('[Sprint Invitation] Không tạo được notification:', error);
    }

    // ========================================
    // ACTIONABLE SOCKET EVENT
    // ========================================

    try {
      this.notificationsGateway.emitEventToUser(
        input.userId,

        'sprint_allocation_invitation',

        payload,
      );

      console.log(
        `[Sprint Invitation] allocation:${input.allocationId} → user:${input.userId}`,
      );
    } catch (error) {
      console.error('[Sprint Invitation] Không emit được socket:', error);
    }

    return payload;
  }
}
