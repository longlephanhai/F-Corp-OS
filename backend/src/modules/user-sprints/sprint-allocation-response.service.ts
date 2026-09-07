import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { UserSprint, UserSprintStatus } from './entities/user-sprint.entity';

import { SprintInvitationDecision } from './dto/respond-sprint-invitation.dto';

import { PmRealtimeService } from '../pm-realtime/pm-realtime.service';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SprintAllocationResponseService {
  constructor(
    @InjectRepository(UserSprint)
    private readonly userSprintRepo: Repository<UserSprint>,

    private readonly pmRealtimeService: PmRealtimeService,

    private readonly notificationsService: NotificationsService,
  ) {}

  // ==========================================
  // GET MY PENDING INVITATIONS
  // ==========================================

  async getMyInvitations(userId: string) {
    const allocations = await this.userSprintRepo.find({
      where: {
        userId,

        status: UserSprintStatus.PENDING_APPROVAL,
      },

      relations: {
        sprint: {
          project: true,
        },
      },
    });

    return allocations
      .sort((left, right) => {
        const leftTime = left.sprint?.startDate
          ? new Date(left.sprint.startDate).getTime()
          : 0;

        const rightTime = right.sprint?.startDate
          ? new Date(right.sprint.startDate).getTime()
          : 0;

        return leftTime - rightTime;
      })
      .map((allocation) => ({
        allocationId: allocation.id,

        status: allocation.status,

        percentage: Number(allocation.percitant ?? 0),

        sprintId: allocation.sprintId,

        sprintName: allocation.sprint?.name ?? 'Sprint',

        startDate: allocation.sprint?.startDate ?? null,

        endDate: allocation.sprint?.endDate ?? null,

        projectId: allocation.sprint?.projectId ?? null,

        projectName: allocation.sprint?.project?.name ?? 'Dự án',
      }));
  }

  // ==========================================
  // RESPOND
  // ==========================================

  async respond(
    userId: string,

    allocationId: string,

    decision: SprintInvitationDecision,

    reason?: string,
  ) {
    // ========================================
    // LOAD OWN INVITATION
    //
    // Query cả id + userId để user không thể
    // phản hồi invitation của người khác.
    // ========================================

    const allocation = await this.userSprintRepo.findOne({
      where: {
        id: allocationId,

        userId,
      },

      relations: {
        user: true,

        sprint: {
          project: {
            managers: true,
          },
        },
      },
    });

    if (!allocation) {
      throw new NotFoundException({
        code: 'SPRINT_INVITATION_NOT_FOUND',

        message: 'Không tìm thấy lời mời Sprint.',
      });
    }

    // ========================================
    // PENDING ONLY
    // ========================================

    if (allocation.status !== UserSprintStatus.PENDING_APPROVAL) {
      throw new ConflictException({
        code: 'SPRINT_INVITATION_ALREADY_RESPONDED',

        message: 'Lời mời này đã được xử lý.',

        currentStatus: allocation.status,
      });
    }

    const sprint = allocation.sprint;

    if (!sprint) {
      throw new NotFoundException({
        code: 'SPRINT_NOT_FOUND',

        message: 'Không tìm thấy Sprint của lời mời.',
      });
    }

    // ========================================
    // TERMINAL SPRINT
    // ========================================

    const sprintStatus = (sprint.status ?? '').toString().toUpperCase();

    if (sprintStatus === 'COMPLETED' || sprintStatus === 'CANCELLED') {
      throw new ConflictException({
        code: 'SPRINT_INVITATION_EXPIRED',

        message:
          'Sprint đã hoàn thành hoặc bị hủy nên lời mời không còn hiệu lực.',

        sprintStatus: sprint.status,
      });
    }

    // ========================================
    // DECLINE
    // ========================================

    if (decision === SprintInvitationDecision.DECLINE) {
      const normalizedReason = reason?.trim();

      if (!normalizedReason) {
        throw new BadRequestException({
          code: 'DECLINE_REASON_REQUIRED',

          message: 'Vui lòng nhập lý do từ chối.',
        });
      }

      allocation.status = UserSprintStatus.DECLINED;

      allocation.responseReason = normalizedReason;

      allocation.respondedAt = new Date();

      const saved = await this.userSprintRepo.save(allocation);

      await this.afterResponse(saved, false);

      return saved;
    }

    // ========================================
    // ACCEPT
    //
    // Re-check capacity tại thời điểm Dev
    // chấp nhận, vì capacity có thể đã thay đổi
    // kể từ lúc PM gửi invitation.
    // ========================================

    await this.assertCapacityStillAvailable(allocation);

    allocation.status = UserSprintStatus.ASSIGNED;

    allocation.responseReason = null;

    allocation.respondedAt = new Date();

    const saved = await this.userSprintRepo.save(allocation);

    await this.afterResponse(saved, true);

    return saved;
  }

  // ==========================================
  // CAPACITY RE-CHECK
  // ==========================================

  private async assertCapacityStillAvailable(allocation: UserSprint) {
    const sprint = allocation.sprint;

    if (!sprint.startDate || !sprint.endDate) {
      throw new ConflictException({
        code: 'SPRINT_TIMELINE_REQUIRED',

        message: 'Sprint chưa có timeline hợp lệ.',
      });
    }

    const activeStatuses = [
      UserSprintStatus.REQUESTED,

      UserSprintStatus.PENDING_APPROVAL,

      UserSprintStatus.ASSIGNED,
    ];

    const otherAllocations = await this.userSprintRepo
      .createQueryBuilder('allocation')

      .innerJoinAndSelect('allocation.sprint', 'sprint')

      .where('allocation.userId = :userId', {
        userId: allocation.userId,
      })

      // Không tính chính invitation hiện tại.
      .andWhere('allocation.id != :allocationId', {
        allocationId: allocation.id,
      })

      .andWhere('allocation.status IN (:...statuses)', {
        statuses: activeStatuses,
      })

      // Timeline overlap.
      .andWhere('sprint.startDate <= :targetEnd', {
        targetEnd: sprint.endDate,
      })

      .andWhere('sprint.endDate >= :targetStart', {
        targetStart: sprint.startDate,
      })

      .getMany();

    const existingCapacity = otherAllocations.reduce(
      (total, current) => total + Number(current.percitant ?? 0),
      0,
    );

    const requested = Number(allocation.percitant ?? 0);

    const afterAccept = existingCapacity + requested;

    if (afterAccept > 100) {
      throw new ConflictException({
        code: 'INVITATION_CAPACITY_CHANGED',

        message: `Bạn hiện chỉ còn ${Math.max(
          0,
          100 - existingCapacity,
        )}% capacity trong thời gian Sprint.`,

        currentAllocation: existingCapacity,

        requestedAllocation: requested,

        afterAllocation: afterAccept,
      });
    }
  }

  // ==========================================
  // AFTER RESPONSE
  // ==========================================

  private async afterResponse(
    allocation: UserSprint,

    accepted: boolean,
  ) {
    // ========================================
    // PM REALTIME REFRESH
    // ========================================
    await this.pmRealtimeService.publishSprintChanged(allocation.sprintId, {
      entity: 'ALLOCATION',

      action: accepted ? 'ASSIGNED' : 'STATUS_CHANGED',

      entityId: allocation.id,
    });

    // ========================================
    // PERSISTENT NOTIFICATION TO ALL PMs
    // ========================================

    try {
      const project = allocation.sprint?.project;

      if (!project) {
        return;
      }

      const pmIds = new Set<string>();

      if (project.pmId) {
        pmIds.add(project.pmId);
      }

      project.managers?.forEach((manager) => {
        if (manager.userId) {
          pmIds.add(manager.userId);
        }
      });

      const employeeName = allocation.user?.fullName ?? 'Nhân sự';

      const sprintName = allocation.sprint?.name ?? 'Sprint';

      await Promise.all(
        [...pmIds].map((pmId) =>
          this.notificationsService.createForUser({
            userId: pmId,

            title: accepted
              ? 'Dev đã chấp nhận lời mời'
              : 'Dev đã từ chối lời mời',

            description: accepted
              ? `${employeeName} đã chấp nhận tham gia ${sprintName}.`
              : `${employeeName} đã từ chối tham gia ${sprintName}.`,

            type: accepted ? 'success' : 'warning',
          }),
        ),
      );
    } catch (error) {
      // Notification không được làm business
      // response thất bại.
      console.error(
        '[Sprint Invitation Response] Không gửi được notification cho PM:',
        error,
      );
    }
  }
}
