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

@Injectable()
export class UserSprintService {
  constructor(
    @InjectRepository(UserSprint)
    private readonly userSprintRepo: Repository<UserSprint>,

    @InjectRepository(Sprint)
    private readonly sprintRepo: Repository<Sprint>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

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

    return await this.userSprintRepo.save(newUserSprint);
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

    return await this.userSprintRepo.save(allocation);
  }

  async cancelRequest(id: string) {
    const allocation = await this.userSprintRepo.findOne({
      where: {
        id,
      },
    });

    if (!allocation) {
      throw new NotFoundException('Không tìm thấy yêu cầu phân bổ.');
    }

    if (allocation.status !== UserSprintStatus.REQUESTED) {
      throw new ForbiddenException({
        code: 'CANNOT_CANCEL_ALLOCATION',

        message: 'Chỉ yêu cầu chưa gửi phê duyệt mới có thể hủy.',
      });
    }

    await this.userSprintRepo.remove(allocation);

    return {
      success: true,
      id,
    };
  }
  // 3. Cập nhật trạng thái (assigned / released)
  async updateStatus(id: string, status: UserSprintStatus) {
    const record = await this.userSprintRepo.findOne({ where: { id } });
    if (!record)
      throw new NotFoundException('Không tìm thấy bản ghi phân bổ này!');

    record.status = status;
    return await this.userSprintRepo.save(record);
  }

  // Hàm Giải phóng & Lưu đánh giá
  async releaseUser(id: string, reviewData: any) {
    const record = await this.userSprintRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('Không tìm thấy bản ghi phân bổ này!');
    }

    if (record.status !== UserSprintStatus.ASSIGNED) {
      throw new ConflictException({
        code: 'INVALID_RELEASE',

        message: 'Chỉ nhân sự đang ASSIGNED mới được giải phóng.',

        currentStatus: record.status,
      });
    }

    // Cập nhật trạng thái và thông tin đánh giá
    record.status = UserSprintStatus.RELEASED;
    record.hardSkillRate = reviewData.hardSkillRate;
    record.softSkillRate = reviewData.softSkillRate;
    record.reviewComment = reviewData.reviewComment;

    return await this.userSprintRepo.save(record);
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
}
