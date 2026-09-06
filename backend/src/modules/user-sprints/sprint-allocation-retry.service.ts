import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { UserSprint, UserSprintStatus } from './entities/user-sprint.entity';

import { SprintAllocationInvitationService } from './sprint-allocation-invitation.service';

import { PmRealtimeService } from '../pm-realtime/pm-realtime.service';

@Injectable()
export class SprintAllocationRetryService {
  constructor(
    @InjectRepository(UserSprint)
    private readonly userSprintRepo: Repository<UserSprint>,

    private readonly sprintAllocationInvitationService: SprintAllocationInvitationService,

    private readonly pmRealtimeService: PmRealtimeService,
  ) {}

  // ==========================================
  // RETRY DECLINED INVITATION
  // ==========================================

  async retry(allocationId: string, percentage?: number) {
    const allocation = await this.userSprintRepo.findOne({
      where: {
        id: allocationId,
      },

      relations: {
        user: true,

        sprint: {
          project: true,
        },
      },
    });

    if (!allocation) {
      throw new NotFoundException({
        code: 'ALLOCATION_NOT_FOUND',

        message: 'Không tìm thấy Allocation.',
      });
    }

    // ========================================
    // DECLINED ONLY
    // ========================================

    if (allocation.status !== UserSprintStatus.DECLINED) {
      throw new ConflictException({
        code: 'ALLOCATION_NOT_DECLINED',

        message: 'Chỉ lời mời đã bị Dev từ chối mới được gửi lại.',

        currentStatus: allocation.status,
      });
    }

    const sprint = allocation.sprint;

    if (!sprint) {
      throw new NotFoundException({
        code: 'SPRINT_NOT_FOUND',

        message: 'Không tìm thấy Sprint.',
      });
    }

    // ========================================
    // SPRINT MUST STILL BE MUTABLE
    // ========================================

    const sprintStatus = (sprint.status ?? '').toString().toUpperCase();

    if (sprintStatus === 'COMPLETED' || sprintStatus === 'CANCELLED') {
      throw new ConflictException({
        code: 'SPRINT_INVITATION_EXPIRED',

        message:
          'Sprint đã hoàn thành hoặc bị hủy nên không thể gửi lại lời mời.',
      });
    }

    // ========================================
    // NEW PERCENTAGE
    // ========================================

    const nextPercentage = percentage ?? Number(allocation.percitant ?? 0);

    // ========================================
    // CAPACITY RE-CHECK
    // ========================================

    await this.assertCapacityAvailable(allocation, nextPercentage);

    // ========================================
    // UPDATE
    //
    // Giữ responseReason/respondedAt cũ.
    // Đây là phản hồi gần nhất của Dev,
    // hữu ích cho PM theo dõi.
    // ========================================

    allocation.percitant = nextPercentage;

    allocation.status = UserSprintStatus.PENDING_APPROVAL;

    const saved = await this.userSprintRepo.save(allocation);

    // ========================================
    // REFRESH ALL PMs
    // ========================================

    await this.pmRealtimeService.publishSprintChanged(saved.sprintId, {
      entity: 'ALLOCATION',

      action: 'STATUS_CHANGED',

      entityId: saved.id,
    });

    // ========================================
    // SEND NEW INVITATION TO DEV
    // ========================================

    await this.sprintAllocationInvitationService.send({
      userId: saved.userId,

      allocationId: saved.id,

      sprintId: sprint.id,

      sprintName: sprint.name ?? 'Sprint',

      projectId: sprint.projectId,

      projectName: sprint.project?.name ?? 'Dự án',

      percentage: Number(saved.percitant ?? 0),

      startDate: sprint.startDate ?? null,

      endDate: sprint.endDate ?? null,
    });

    return saved;
  }

  // ==========================================
  // CAPACITY
  // ==========================================

  private async assertCapacityAvailable(
    allocation: UserSprint,
    requestedPercentage: number,
  ) {
    const sprint = allocation.sprint;

    if (!sprint?.startDate || !sprint?.endDate) {
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

    const allocations = await this.userSprintRepo
      .createQueryBuilder('allocation')

      .innerJoin('allocation.sprint', 'sprint')

      .where('allocation.userId = :userId', {
        userId: allocation.userId,
      })

      // Không tính record đang retry.
      .andWhere('allocation.id != :allocationId', {
        allocationId: allocation.id,
      })

      .andWhere('allocation.status IN (:...statuses)', {
        statuses: activeStatuses,
      })

      .andWhere('sprint.startDate <= :targetEnd', {
        targetEnd: sprint.endDate,
      })

      .andWhere('sprint.endDate >= :targetStart', {
        targetStart: sprint.startDate,
      })

      .getMany();

    const usedPercentage = allocations.reduce(
      (total, current) => total + Number(current.percitant ?? 0),
      0,
    );

    const afterRetry = usedPercentage + requestedPercentage;

    if (afterRetry > 100) {
      throw new ConflictException({
        code: 'ALLOCATION_CAPACITY_EXCEEDED',

        message: `Nhân sự chỉ còn ${Math.max(
          0,
          100 - usedPercentage,
        )}% capacity trong thời gian Sprint.`,

        usedPercentage,

        requestedPercentage,

        afterRetry,
      });
    }
  }
}
