import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSprint, UserSprintStatus } from './entities/user-sprint.entity';
import { Sprint } from '../sprints/entities/sprint.entity';
import { User } from '../users/entities/user.entity';
import { Task, TaskStatus } from '../task/entities/task.entity';
import {
  PmRealtimeAction,
  PmRealtimeService,
} from '../pm-realtime/pm-realtime.service';

@Injectable()
export class UserSprintService {
  constructor(
    @InjectRepository(UserSprint)
    private readonly userSprintRepo: Repository<UserSprint>,

    @InjectRepository(Sprint)
    private readonly sprintRepo: Repository<Sprint>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly pmRealtimeService: PmRealtimeService,
  ) {}

  // ==========================================
  // PM REALTIME
  // ==========================================

  private async publishAllocationChanged(
    allocation: Pick<UserSprint, 'id' | 'sprintId'>,
    action: PmRealtimeAction,
  ) {
    await this.pmRealtimeService.publishSprintChanged(allocation.sprintId, {
      entity: 'ALLOCATION',

      action,

      entityId: allocation.id,
    });
  }

  // 1. Lấy danh sách nhân sự tham gia Sprint (Có JOIN với bảng User để lấy Tên, Email)
  async getSprintUsers(sprintId: string) {
    const records = await this.userSprintRepo.find({
      where: { sprintId },
      relations: { user: true }, // Tự động móc thông tin user từ DB lên
      select: {
        user: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    });
    return records;
  }

  async getUserCapacity(userId: string, sprintId: string) {
    const sprint = await this.sprintRepo.findOne({
      where: {
        id: sprintId,
      },
    });

    if (!sprint) {
      throw new NotFoundException('Không tìm thấy Sprint.');
    }

    const activeStatuses = [
      UserSprintStatus.REQUESTED,
      UserSprintStatus.PENDING_APPROVAL,
      UserSprintStatus.ASSIGNED,
    ];

    const allocations = await this.userSprintRepo
      .createQueryBuilder('userSprint')
      .innerJoinAndSelect('userSprint.sprint', 'sprint')
      .where('userSprint.userId = :userId', {
        userId,
      })
      .andWhere('userSprint.status IN (:...activeStatuses)', {
        activeStatuses,
      })
      .andWhere('sprint.startDate <= :targetEnd', {
        targetEnd: sprint.endDate,
      })
      .andWhere('sprint.endDate >= :targetStart', {
        targetStart: sprint.startDate,
      })
      .getMany();

    const currentAllocation = allocations.reduce(
      (sum, allocation) => sum + Number(allocation.percitant ?? 0),
      0,
    );

    const availableCapacity = Math.max(0, 100 - currentAllocation);

    return {
      userId,
      sprintId,

      currentAllocation,
      availableCapacity,

      allocations: allocations.map((allocation) => ({
        allocationId: allocation.id,

        sprintId: allocation.sprintId,

        sprintName: allocation.sprint?.name,

        percentage: allocation.percitant,

        status: allocation.status,

        startDate: allocation.sprint?.startDate,

        endDate: allocation.sprint?.endDate,
      })),
    };
  }

  // 2. PM gửi yêu cầu gán nhân sự
  async assignUserToSprint(data: {
    sprintId: string;
    userId: string;
    percitant: number;
  }) {
    // ==========================================
    // 1. VALIDATE INPUT
    // ==========================================

    const requestedPercentage = Number(data.percitant);

    if (
      !Number.isFinite(requestedPercentage) ||
      requestedPercentage < 1 ||
      requestedPercentage > 100
    ) {
      throw new BadRequestException('Phần trăm phân bổ phải từ 1 đến 100.');
    }

    // ==========================================
    // 2. KIỂM TRA SPRINT CÓ TỒN TẠI
    // ==========================================

    const sprint = await this.sprintRepo.findOne({
      where: {
        id: data.sprintId,
      },
    });

    if (!sprint) {
      throw new NotFoundException('Không tìm thấy Sprint.');
    }
    this.assertSprintMutable(sprint);
    if (!sprint.startDate || !sprint.endDate) {
      throw new BadRequestException(
        'Sprint chưa có thời gian bắt đầu/kết thúc nên chưa thể phân bổ nhân sự.',
      );
    }

    // ==========================================
    // 3. CHỐNG REQUEST TRÙNG TRONG CÙNG SPRINT
    // ==========================================

    const activeStatuses = [
      UserSprintStatus.REQUESTED,
      UserSprintStatus.PENDING_APPROVAL,
      UserSprintStatus.ASSIGNED,
    ];

    const duplicateAllocation = await this.userSprintRepo
      .createQueryBuilder('userSprint')
      .where('userSprint.sprintId = :sprintId', {
        sprintId: data.sprintId,
      })
      .andWhere('userSprint.userId = :userId', {
        userId: data.userId,
      })
      .andWhere('userSprint.status IN (:...activeStatuses)', {
        activeStatuses,
      })
      .getOne();

    if (duplicateAllocation) {
      throw new ConflictException({
        code: 'DUPLICATE_ALLOCATION',

        message:
          'Nhân sự này đã có yêu cầu phân bổ đang hoạt động trong Sprint.',

        allocationId: duplicateAllocation.id,

        status: duplicateAllocation.status,
      });
    }

    // ==========================================
    // 4. TÌM CÁC SPRINT BỊ TRÙNG THỜI GIAN
    // ==========================================

    const overlappingAllocations = await this.userSprintRepo
      .createQueryBuilder('userSprint')

      .innerJoinAndSelect('userSprint.sprint', 'sprint')

      .where('userSprint.userId = :userId', {
        userId: data.userId,
      })

      .andWhere('userSprint.status IN (:...activeStatuses)', {
        activeStatuses,
      })

      // Không tính Sprint hiện tại.
      // Trường hợp duplicate đã được xử lý phía trên.
      .andWhere('userSprint.sprintId != :sprintId', {
        sprintId: data.sprintId,
      })

      // overlap:
      // existing.start <= requested.end
      // AND
      // existing.end >= requested.start
      .andWhere('sprint.startDate <= :requestedEnd', {
        requestedEnd: sprint.endDate,
      })

      .andWhere('sprint.endDate >= :requestedStart', {
        requestedStart: sprint.startDate,
      })

      .getMany();

    // ==========================================
    // 5. TÍNH CAPACITY HIỆN TẠI
    // ==========================================

    const currentAllocation = overlappingAllocations.reduce(
      (total, allocation) => total + Number(allocation.percitant ?? 0),
      0,
    );

    const availableCapacity = Math.max(0, 100 - currentAllocation);

    const afterAllocation = currentAllocation + requestedPercentage;

    // ==========================================
    // 6. CHẶN OVER-ALLOCATION
    // ==========================================

    if (afterAllocation > 100) {
      throw new ConflictException({
        code: 'OVER_ALLOCATION',

        message: `Nhân sự hiện chỉ còn ${availableCapacity}% capacity trong khoảng thời gian của Sprint.`,

        currentAllocation,

        requestedAllocation: requestedPercentage,

        availableCapacity,

        afterAllocation,

        conflicts: overlappingAllocations.map((allocation) => ({
          allocationId: allocation.id,

          sprintId: allocation.sprintId,

          sprintName: allocation.sprint?.name,

          percentage: allocation.percitant,

          status: allocation.status,

          startDate: allocation.sprint?.startDate,

          endDate: allocation.sprint?.endDate,
        })),
      });
    }

    // ==========================================
    // 7. HỢP LỆ -> TẠO REQUEST
    // ==========================================

    const newUserSprint = this.userSprintRepo.create({
      sprintId: data.sprintId,

      userId: data.userId,

      percitant: requestedPercentage,

      status: UserSprintStatus.REQUESTED,
    });

    const savedAllocation = await this.userSprintRepo.save(newUserSprint);

    await this.publishAllocationChanged(savedAllocation, 'CREATED');

    return savedAllocation;
  }
  async submitForApproval(id: string) {
    const allocation = await this.userSprintRepo.findOne({
      where: {
        id,
      },
      relations: {
        user: true,
        sprint: true,
      },
    });

    if (!allocation) {
      throw new NotFoundException('Không tìm thấy yêu cầu phân bổ.');
    }
    if (!allocation.sprint) {
      throw new NotFoundException('Không tìm thấy Sprint của allocation.');
    }

    this.assertSprintMutable(allocation.sprint);

    if (allocation.status !== UserSprintStatus.REQUESTED) {
      throw new ConflictException({
        code: 'INVALID_ALLOCATION_TRANSITION',

        message:
          'Chỉ allocation ở trạng thái REQUESTED mới được gửi phê duyệt.',

        currentStatus: allocation.status,

        expectedStatus: UserSprintStatus.REQUESTED,
      });
    }

    allocation.status = UserSprintStatus.PENDING_APPROVAL;

    const savedAllocation = await this.userSprintRepo.save(allocation);

    await this.publishAllocationChanged(savedAllocation, 'STATUS_CHANGED');

    return savedAllocation;
  }

  async cancelRequest(id: string) {
    const allocation = await this.userSprintRepo.findOne({
      where: {
        id,
      },

      relations: {
        sprint: true,
      },
    });

    if (!allocation) {
      throw new NotFoundException('Không tìm thấy yêu cầu phân bổ.');
    }

    if (!allocation.sprint) {
      throw new NotFoundException('Không tìm thấy Sprint của allocation.');
    }

    // Sprint COMPLETED / CANCELLED
    // thì allocation phải read-only.
    this.assertSprintMutable(allocation.sprint);

    if (allocation.status !== UserSprintStatus.REQUESTED) {
      throw new ForbiddenException({
        code: 'CANNOT_CANCEL_ALLOCATION',

        message: 'Chỉ allocation ở trạng thái REQUESTED mới được hủy.',

        currentStatus: allocation.status,
      });
    }
    const realtimeAllocation = {
      id: allocation.id,

      sprintId: allocation.sprintId,
    };
    await this.userSprintRepo.remove(allocation);

    await this.publishAllocationChanged(realtimeAllocation, 'DELETED');

    return {
      success: true,

      id,
    };
  }
  private async assertAllocationCapacityBeforeAssign(allocation: UserSprint) {
    if (!allocation.sprint) {
      throw new NotFoundException('Không tìm thấy Sprint của allocation.');
    }

    const requestedPercentage = Number(allocation.percitant ?? 0);

    const activeStatuses = [
      UserSprintStatus.REQUESTED,
      UserSprintStatus.PENDING_APPROVAL,
      UserSprintStatus.ASSIGNED,
    ];

    const overlappingAllocations = await this.userSprintRepo
      .createQueryBuilder('userSprint')
      .innerJoinAndSelect('userSprint.sprint', 'sprint')
      .where('userSprint.userId = :userId', {
        userId: allocation.userId,
      })
      // Không tính chính allocation
      // đang được approve.
      .andWhere('userSprint.id != :allocationId', {
        allocationId: allocation.id,
      })
      .andWhere('userSprint.status IN (:...activeStatuses)', {
        activeStatuses,
      })
      .andWhere('sprint.startDate <= :targetEnd', {
        targetEnd: allocation.sprint.endDate,
      })
      .andWhere('sprint.endDate >= :targetStart', {
        targetStart: allocation.sprint.startDate,
      })
      .getMany();

    const currentAllocation = overlappingAllocations.reduce(
      (total, item) => total + Number(item.percitant ?? 0),
      0,
    );

    const afterAllocation = currentAllocation + requestedPercentage;

    if (afterAllocation > 100) {
      const availableCapacity = Math.max(0, 100 - currentAllocation);

      throw new ConflictException({
        code: 'ALLOCATION_CAPACITY_CHANGED',

        message: `Capacity của nhân sự đã thay đổi. Hiện chỉ còn ${availableCapacity}% nên không thể duyệt allocation ${requestedPercentage}%.`,

        userId: allocation.userId,

        currentAllocation,

        requestedAllocation: requestedPercentage,

        availableCapacity,

        afterAllocation,

        conflicts: overlappingAllocations.map((item) => ({
          allocationId: item.id,

          sprintId: item.sprintId,

          sprintName: item.sprint?.name,

          percentage: Number(item.percitant ?? 0),

          status: item.status,
        })),
      });
    }

    return true;
  }

  // 3. Cập nhật trạng thái (assigned / released)
  async updateStatus(id: string, status: UserSprintStatus) {
    const record = await this.userSprintRepo.findOne({
      where: {
        id,
      },

      relations: {
        sprint: true,
      },
    });

    if (!record) {
      throw new NotFoundException('Không tìm thấy bản ghi phân bổ này!');
    }

    if (!record.sprint) {
      throw new NotFoundException('Không tìm thấy Sprint của allocation.');
    }

    // ==========================================
    // VALID TARGET STATUS
    // ==========================================

    const validStatuses = Object.values(UserSprintStatus);

    if (!validStatuses.includes(status)) {
      throw new BadRequestException({
        code: 'INVALID_ALLOCATION_STATUS',

        message: 'Trạng thái allocation không hợp lệ.',

        requestedStatus: status,
      });
    }

    // ==========================================
    // TERMINAL SPRINT
    // ==========================================

    this.assertSprintMutable(record.sprint);

    // ==========================================
    // SAME STATUS
    // ==========================================

    if (record.status === status) {
      return record;
    }

    // ==========================================
    // RELEASE KHÔNG ĐƯỢC BYPASS
    // ==========================================
    //
    // Release phải đi qua:
    //
    // PATCH /user-sprint/:id/release
    //
    // vì endpoint đó:
    // - check unfinished Task
    // - lưu hard skill
    // - lưu soft skill
    // - lưu review
    // ==========================================

    if (status === UserSprintStatus.RELEASED) {
      throw new ConflictException({
        code: 'USE_RELEASE_WORKFLOW',

        message:
          'Không thể chuyển trực tiếp allocation sang RELEASED. Hãy sử dụng quy trình Release & Review.',
      });
    }

    // ==========================================
    // STATE MACHINE
    // ==========================================
    //
    // REQUESTED
    //      ↓ dedicated endpoint submit-approval
    //
    // PENDING_APPROVAL
    //      ↓
    // ASSIGNED
    //
    // ASSIGNED
    //      ↓ dedicated release endpoint
    //
    // RELEASED
    //      terminal
    // ==========================================

    if (
      record.status !== UserSprintStatus.PENDING_APPROVAL ||
      status !== UserSprintStatus.ASSIGNED
    ) {
      throw new ConflictException({
        code: 'INVALID_ALLOCATION_TRANSITION',

        message: `Không thể chuyển allocation từ ${record.status} sang ${status}.`,

        currentStatus: record.status,

        requestedStatus: status,

        allowedTransition:
          record.status === UserSprintStatus.PENDING_APPROVAL
            ? UserSprintStatus.ASSIGNED
            : null,
      });
    }

    // ==========================================
    // RE-CHECK CAPACITY
    // ==========================================

    await this.assertAllocationCapacityBeforeAssign(record);

    // ==========================================
    // APPROVE
    // ==========================================

    record.status = UserSprintStatus.ASSIGNED;

    record.status = status;

    const savedAllocation = await this.userSprintRepo.save(record);

    await this.publishAllocationChanged(
      savedAllocation,
      status === UserSprintStatus.ASSIGNED ? 'ASSIGNED' : 'STATUS_CHANGED',
    );

    return savedAllocation;
  }

  private async assertUserCanBeReleasedFromSprint(
    sprintId: string,
    userId: string,
  ) {
    const ownedTasks = await this.taskRepo.find({
      where: {
        sprintId,
        userId,
        isDeleted: false,
      },

      order: {
        createdAt: 'ASC',
      },
    });

    if (ownedTasks.length === 0) {
      return true;
    }

    const unfinishedTasks = ownedTasks.filter((task) => {
      const status = (task.status ?? '').toString().toUpperCase();

      const progress = Number(task.progress ?? 0);

      return status !== TaskStatus.DONE || progress < 100;
    });

    if (unfinishedTasks.length > 0) {
      throw new ConflictException({
        code: 'USER_HAS_UNFINISHED_TASKS',

        message: `Nhân sự vẫn đang phụ trách ${unfinishedTasks.length} Task chưa hoàn thành. Hãy hoàn thành, đổi owner hoặc bỏ owner trước khi Release.`,

        sprintId,

        userId,

        unfinishedTasks: unfinishedTasks.map((task) => ({
          id: task.id,

          title: task.title ?? 'Task chưa đặt tên',

          status: task.status,

          progress: Number(task.progress ?? 0),

          priority: task.priority,
        })),
      });
    }

    return true;
  }

  // Hàm Giải phóng & Lưu đánh giá
  async releaseUser(id: string, reviewData: any) {
    const record = await this.userSprintRepo.findOne({
      where: {
        id,
      },

      relations: {
        sprint: true,
      },
    });
    if (!record) {
      throw new NotFoundException('Không tìm thấy bản ghi phân bổ này!');
    }
    if (!record.sprint) {
      throw new NotFoundException('Không tìm thấy Sprint của allocation.');
    }

    this.assertSprintMutable(record.sprint);

    if (record.status !== UserSprintStatus.ASSIGNED) {
      throw new ConflictException({
        code: 'INVALID_RELEASE',

        message: 'Chỉ nhân sự đang ASSIGNED mới được giải phóng.',

        currentStatus: record.status,
      });
    }

    // ==========================================
    // TASK OWNERSHIP GUARD
    // ==========================================
    //
    // Chỉ khi allocation đang ASSIGNED
    // mới kiểm tra xem nhân sự còn đang
    // sở hữu Task chưa DONE hay không.
    //
    // Nếu còn:
    // → chặn Release
    //
    // Nếu không:
    // → cho Release
    // ==========================================

    await this.assertUserCanBeReleasedFromSprint(
      record.sprintId,
      record.userId,
    );

    // Cập nhật trạng thái và thông tin đánh giá
    record.status = UserSprintStatus.RELEASED;

    // Cập nhật trạng thái và thông tin đánh giá
    record.status = UserSprintStatus.RELEASED;

    // Cập nhật trạng thái và thông tin đánh giá
    record.status = UserSprintStatus.RELEASED;
    record.hardSkillRate = reviewData.hardSkillRate;
    record.softSkillRate = reviewData.softSkillRate;
    record.reviewComment = reviewData.reviewComment;

    const savedAllocation = await this.userSprintRepo.save(record);

    await this.publishAllocationChanged(savedAllocation, 'RELEASED');

    return savedAllocation;
  }

  async getResourcePlanner(pmId: string) {
    // ==========================================
    // 1. LẤY TEAM CỦA PM
    // ==========================================

    const teamMembers = await this.userRepo.find({
      where: {
        managerId: pmId,
        isDeleted: false,
      },

      select: {
        id: true,
        fullName: true,
        email: true,
        title: true,
        status: true,
      },

      order: {
        fullName: 'ASC',
      },
    });

    if (teamMembers.length === 0) {
      return {
        generatedAt: new Date(),

        summary: {
          totalResources: 0,
          availableResources: 0,
          nearFullResources: 0,
          fullResources: 0,
          overAllocatedResources: 0,
          totalUsedFte: 0,
        },

        resources: [],
      };
    }

    const userIds = teamMembers.map((member) => member.id);

    // ==========================================
    // 2. LẤY ALLOCATION CÒN HIỆU LỰC
    // ==========================================

    const allocations = await this.userSprintRepo
      .createQueryBuilder('allocation')

      .leftJoinAndSelect('allocation.sprint', 'sprint')

      .leftJoinAndSelect('sprint.project', 'project')

      .where('allocation.userId IN (:...userIds)', {
        userIds,
      })

      .andWhere('allocation.status IN (:...statuses)', {
        statuses: [
          UserSprintStatus.REQUESTED,
          UserSprintStatus.PENDING_APPROVAL,
          UserSprintStatus.ASSIGNED,
        ],
      })

      .getMany();

    // ==========================================
    // 3. CHỈ TÍNH CAPACITY TẠI THỜI ĐIỂM HIỆN TẠI
    // ==========================================

    const now = new Date().getTime();

    const currentAllocations = allocations.filter((allocation) => {
      if (
        !allocation.sprint ||
        !allocation.sprint.startDate ||
        !allocation.sprint.endDate
      ) {
        return false;
      }

      const startTime = new Date(allocation.sprint.startDate).getTime();

      const endTime = new Date(allocation.sprint.endDate).getTime();

      return now >= startTime && now <= endTime;
    });

    // ==========================================
    // 4. GROUP THEO USER
    // ==========================================

    const resources = teamMembers.map((member) => {
      const memberAllocations = currentAllocations.filter(
        (allocation) => allocation.userId === member.id,
      );

      const assignedAllocation = memberAllocations
        .filter((allocation) => allocation.status === UserSprintStatus.ASSIGNED)
        .reduce(
          (total, allocation) => total + Number(allocation.percitant ?? 0),
          0,
        );

      const pendingAllocation = memberAllocations
        .filter(
          (allocation) =>
            allocation.status === UserSprintStatus.REQUESTED ||
            allocation.status === UserSprintStatus.PENDING_APPROVAL,
        )
        .reduce(
          (total, allocation) => total + Number(allocation.percitant ?? 0),
          0,
        );

      // Capacity engine hiện tại reserve luôn
      // REQUESTED / PENDING / ASSIGNED.
      const usedCapacity = assignedAllocation + pendingAllocation;

      const availableCapacity = Math.max(0, 100 - usedCapacity);

      let capacityStatus: 'AVAILABLE' | 'NEAR_FULL' | 'FULL' | 'OVER_ALLOCATED';

      if (usedCapacity > 100) {
        capacityStatus = 'OVER_ALLOCATED';
      } else if (usedCapacity === 100) {
        capacityStatus = 'FULL';
      } else if (usedCapacity >= 80) {
        capacityStatus = 'NEAR_FULL';
      } else {
        capacityStatus = 'AVAILABLE';
      }

      return {
        id: member.id,

        fullName: member.fullName,

        email: member.email,

        title: member.title,

        employeeStatus: member.status,

        assignedAllocation,

        pendingAllocation,

        usedCapacity,

        availableCapacity,

        capacityStatus,

        allocations: memberAllocations.map((allocation) => ({
          id: allocation.id,

          percitant: Number(allocation.percitant ?? 0),

          status: allocation.status,

          sprintId: allocation.sprintId,

          sprintName: allocation.sprint?.name ?? null,

          sprintStartDate: allocation.sprint?.startDate ?? null,

          sprintEndDate: allocation.sprint?.endDate ?? null,

          projectId: allocation.sprint?.projectId ?? null,

          projectName: allocation.sprint?.project?.name ?? null,
        })),
      };
    });

    // ==========================================
    // 5. SUMMARY
    // ==========================================

    const availableResources = resources.filter(
      (resource) => resource.capacityStatus === 'AVAILABLE',
    ).length;

    const nearFullResources = resources.filter(
      (resource) => resource.capacityStatus === 'NEAR_FULL',
    ).length;

    const fullResources = resources.filter(
      (resource) => resource.capacityStatus === 'FULL',
    ).length;

    const overAllocatedResources = resources.filter(
      (resource) => resource.capacityStatus === 'OVER_ALLOCATED',
    ).length;

    const totalUsedFte =
      resources.reduce((total, resource) => total + resource.usedCapacity, 0) /
      100;

    return {
      generatedAt: new Date(),

      summary: {
        totalResources: resources.length,

        availableResources,

        nearFullResources,

        fullResources,

        overAllocatedResources,

        totalUsedFte,
      },

      resources,
    };
  }
  private assertSprintMutable(sprint: Sprint) {
    const status = (sprint.status ?? '').toString().toUpperCase();

    if (status === 'COMPLETED' || status === 'CANCELLED') {
      throw new ConflictException({
        code: 'SPRINT_READ_ONLY',
        message:
          'Sprint đã hoàn thành hoặc đã hủy. Không thể thay đổi phân bổ nhân sự.',
        sprintId: sprint.id,
        sprintStatus: sprint.status,
      });
    }
  }
}
