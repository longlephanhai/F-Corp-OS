import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { In, Repository } from 'typeorm';

import dayjs from 'dayjs';

import { CreateSprintDto } from './dto/create-sprint.dto';

import { UpdateSprintDto } from './dto/update-sprint.dto';

import {
  SprintTargetStatus,
  UpdateSprintStatusDto,
} from './dto/update-sprint-status.dto';

import { Sprint } from './entities/sprint.entity';

import { Project } from '../projects/entities/project.entity';

import { Task, TaskStatus } from '../task/entities/task.entity';

import {
  UserSprint,
  UserSprintStatus,
} from '../user-sprints/entities/user-sprint.entity';

import { TaskDependenciesService } from '../task-dependencies/task-dependencies.service';

@Injectable()
export class SprintsService {
  constructor(
    @InjectRepository(Sprint)
    private readonly sprintRepo: Repository<Sprint>,

    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    @InjectRepository(UserSprint)
    private readonly userSprintRepo: Repository<UserSprint>,

    private readonly taskDependenciesService: TaskDependenciesService,
  ) {}

  // ==========================================
  // CREATE
  // ==========================================

  async create(createSprintDto: CreateSprintDto) {
    return this.createSprint(createSprintDto);
  }

  // ==========================================
  // FIND ALL
  // ==========================================

  async findAll() {
    return await this.sprintRepo.find({
      where: {
        isDeleted: false,
      },

      relations: {
        project: true,
      },

      order: {
        startDate: 'ASC',
      },
    });
  }

  // ==========================================
  // FIND ONE
  // ==========================================

  async findOne(id: string) {
    const sprint = await this.sprintRepo.findOne({
      where: {
        id,
        isDeleted: false,
      },

      relations: {
        project: true,
      },
    });

    if (!sprint) {
      throw new NotFoundException({
        code: 'SPRINT_NOT_FOUND',

        message: 'Không tìm thấy Sprint.',
      });
    }

    return sprint;
  }

  // ==========================================
  // GET SPRINTS BY PROJECT
  // ==========================================

  async getSprintsByProject(projectId: string) {
    await this.getProjectOrFail(projectId);

    return await this.sprintRepo.find({
      where: {
        projectId,
        isDeleted: false,
      },

      relations: {
        project: true,
      },

      order: {
        startDate: 'ASC',
      },
    });
  }

  // ==========================================
  // CREATE SPRINT
  // ==========================================

  async createSprint(data: CreateSprintDto) {
    const project = await this.getProjectOrFail(data.projectId);

    const name = data.name?.trim();

    if (!name) {
      throw new BadRequestException({
        code: 'INVALID_SPRINT_NAME',

        message: 'Tên Sprint không được để trống.',
      });
    }

    this.validateSprintDates(data.startDate, data.endDate);

    this.validateSprintInsideProject(data.startDate, data.endDate, project);
    await this.assertNoSprintOverlap(project.id, data.startDate, data.endDate);

    const status = this.determineInitialStatus(data.startDate);

    const attendant = this.normalizeAttendant(data.attendant);

    const newSprint = this.sprintRepo.create({
      name,

      projectId: project.id,

      project,

      startDate: new Date(data.startDate),

      endDate: new Date(data.endDate),

      attendant,

      status,

      isDeleted: false,
    });

    return await this.sprintRepo.save(newSprint);
  }

  // ==========================================
  // UPDATE INFORMATION
  // ==========================================

  async update(id: string, updateSprintDto: UpdateSprintDto) {
    const sprint = await this.findOne(id);

    const currentStatus = this.normalizeStatus(sprint.status);

    if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
      throw new ConflictException({
        code: 'SPRINT_TERMINAL_STATE',

        message: 'Sprint đã hoàn thành hoặc đã hủy nên không thể chỉnh sửa.',
      });
    }

    const projectId = updateSprintDto.projectId ?? sprint.projectId;

    const project = await this.getProjectOrFail(projectId);

    const startDate = updateSprintDto.startDate ?? sprint.startDate;

    const endDate = updateSprintDto.endDate ?? sprint.endDate;

    this.validateSprintDates(startDate, endDate);

    this.validateSprintInsideProject(startDate, endDate, project);
    await this.assertNoSprintOverlap(project.id, startDate, endDate, sprint.id);
    const timelineChanged =
      updateSprintDto.startDate !== undefined ||
      updateSprintDto.endDate !== undefined;

    if (timelineChanged) {
      await this.assertSprintTimelineChangeSafe(sprint, startDate, endDate);
    }

    // ========================================
    // ACTIVE SPRINT CANNOT MOVE TO FUTURE
    // ========================================

    if (
      currentStatus === 'ACTIVE' &&
      dayjs(startDate).isAfter(dayjs(), 'day')
    ) {
      throw new ConflictException({
        code: 'INVALID_ACTIVE_SPRINT_TIMELINE',

        message:
          'Sprint đang ACTIVE không thể đổi ngày bắt đầu sang tương lai.',
      });
    }

    // ========================================
    // NAME
    // ========================================

    if (updateSprintDto.name !== undefined) {
      const normalizedName = updateSprintDto.name.trim();

      if (!normalizedName) {
        throw new BadRequestException({
          code: 'INVALID_SPRINT_NAME',

          message: 'Tên Sprint không được để trống.',
        });
      }

      sprint.name = normalizedName;
    }

    // ========================================
    // PROJECT
    // ========================================

    if (updateSprintDto.projectId !== undefined) {
      sprint.projectId = project.id;

      sprint.project = project;
    }

    // ========================================
    // START DATE
    // ========================================

    if (updateSprintDto.startDate !== undefined) {
      sprint.startDate = new Date(updateSprintDto.startDate);
    }

    // ========================================
    // END DATE
    // ========================================

    if (updateSprintDto.endDate !== undefined) {
      sprint.endDate = new Date(updateSprintDto.endDate);
    }

    // ========================================
    // ATTENDANT
    // ========================================

    if (updateSprintDto.attendant !== undefined) {
      sprint.attendant = this.normalizeAttendant(updateSprintDto.attendant);
    }

    // ========================================
    // IMPORTANT
    //
    // Không tự động đổi status ở PATCH info.
    //
    // Status chỉ thay đổi thông qua:
    //
    // PATCH /sprints/:id/status
    // ========================================

    return await this.sprintRepo.save(sprint);
  }

  // ==========================================
  // UPDATE LIFECYCLE STATUS
  // ==========================================

  async updateStatus(id: string, dto: UpdateSprintStatusDto) {
    const sprint = await this.findOne(id);

    const currentStatus = this.normalizeStatus(sprint.status);

    const targetStatus = this.normalizeStatus(dto.status);

    // ========================================
    // SAME STATUS
    // ========================================

    if (currentStatus === targetStatus) {
      return sprint;
    }

    // ========================================
    // TERMINAL STATE
    // ========================================

    if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
      throw new ConflictException({
        code: 'SPRINT_TERMINAL_STATE',

        message:
          'Sprint đã hoàn thành hoặc đã hủy nên không thể chuyển trạng thái.',
        currentStatus: sprint.status,
        requestedStatus: dto.status,
      });
    }

    // ========================================
    // VALID TRANSITION
    // ========================================

    const allowedTransitions: Record<string, string[]> = {
      UPCOMING: ['ACTIVE', 'CANCELLED'],

      ACTIVE: ['COMPLETED', 'CANCELLED'],
    };

    const allowed = allowedTransitions[currentStatus] ?? [];

    if (!allowed.includes(targetStatus)) {
      throw new ConflictException({
        code: 'INVALID_SPRINT_TRANSITION',

        message: `Không thể chuyển Sprint từ ${currentStatus} sang ${targetStatus}.`,

        currentStatus: sprint.status,

        requestedStatus: dto.status,

        allowedTransitions: allowed.map((status) => status.toLowerCase()),
      });
    }

    // ========================================
    // UPCOMING -> ACTIVE
    // ========================================

    if (dto.status === SprintTargetStatus.ACTIVE) {
      await this.assertSprintCanStart(sprint);
    }

    // ========================================
    // ACTIVE -> COMPLETED
    // ========================================

    if (dto.status === SprintTargetStatus.COMPLETED) {
      await this.assertSprintCanComplete(sprint);
    }

    // ========================================
    // -> CANCELLED
    // ========================================

    if (dto.status === SprintTargetStatus.CANCELLED) {
      await this.prepareSprintCancellation(sprint);
    }

    sprint.status = dto.status;

    return await this.sprintRepo.save(sprint);
  }

  // ==========================================
  // START GUARD
  // ==========================================

  async getStartReadiness(sprintId: string) {
    const sprint = await this.findOne(sprintId);

    const tasks = await this.taskRepo.find({
      where: {
        sprintId: sprint.id,

        isDeleted: false,
      },
    });

    const allocations = await this.userSprintRepo.find({
      where: {
        sprintId: sprint.id,
      },
    });

    // ==========================================
    // ALLOCATION
    // ==========================================

    const assignedAllocations = allocations.filter(
      (allocation) => allocation.status === UserSprintStatus.ASSIGNED,
    );

    const pendingAllocations = allocations.filter(
      (allocation) =>
        allocation.status === UserSprintStatus.REQUESTED ||
        allocation.status === UserSprintStatus.PENDING_APPROVAL,
    );

    // ==========================================
    // TASK OWNER
    // ==========================================

    const unassignedTasks = tasks.filter((task) => !task.userId);

    // ==========================================
    // DEPENDENCY
    // ==========================================

    const dependencyStatuses = await Promise.all(
      tasks.map(async (task) => {
        try {
          return await this.taskDependenciesService.getDependencyStatus(
            task.id,
          );
        } catch {
          return {
            taskId: task.id,

            totalDependencies: 0,

            unfinishedDependencies: 0,

            isBlockedByDependency: false,
          };
        }
      }),
    );

    const dependencyBlockedTasks = dependencyStatuses.filter(
      (status) => status.isBlockedByDependency,
    );

    // ==========================================
    // HARD BLOCKERS
    // ==========================================

    const blockers: string[] = [];

    const startDate = dayjs(sprint.startDate);

    if (dayjs().isBefore(startDate, 'day')) {
      blockers.push(
        `Chưa đến ngày bắt đầu Sprint (${startDate.format('DD/MM/YYYY')}).`,
      );
    }

    if (tasks.length === 0) {
      blockers.push('Sprint chưa có Task.');
    }

    if (assignedAllocations.length === 0) {
      blockers.push('Sprint chưa có nhân sự ASSIGNED.');
    }

    // ==========================================
    // WARNINGS
    // ==========================================

    const warnings: string[] = [];

    if (unassignedTasks.length > 0) {
      warnings.push(`${unassignedTasks.length} Task chưa có owner.`);
    }

    if (pendingAllocations.length > 0) {
      warnings.push(`${pendingAllocations.length} allocation đang chờ xử lý.`);
    }

    if (dependencyBlockedTasks.length > 0) {
      warnings.push(
        `${dependencyBlockedTasks.length} Task đang chờ dependency.`,
      );
    }

    // ==========================================
    // RESULT
    // ==========================================

    return {
      sprintId: sprint.id,

      sprintName: sprint.name,

      sprintStatus: sprint.status,

      canStart: blockers.length === 0,

      blockers,

      warnings,

      summary: {
        totalTasks: tasks.length,

        assignedTasks: tasks.length - unassignedTasks.length,

        unassignedTasks: unassignedTasks.length,

        assignedResources: assignedAllocations.length,

        pendingAllocations: pendingAllocations.length,

        dependencyBlockedTasks: dependencyBlockedTasks.length,
      },
    };
  }

  private async assertSprintCanStart(sprint: Sprint) {
    const readiness = await this.getStartReadiness(sprint.id);

    if (!readiness.canStart) {
      throw new ConflictException({
        code: 'SPRINT_NOT_READY',

        message: 'Sprint chưa đủ điều kiện để bắt đầu.',

        blockers: readiness.blockers,

        warnings: readiness.warnings,

        summary: readiness.summary,
      });
    }

    return readiness;
  }

  // ==========================================
  // COMPLETION GUARD
  // ==========================================

  private async assertSprintCanComplete(sprint: Sprint) {
    // ========================================
    // 1. TASKS
    // ========================================

    const tasks = await this.taskRepo.find({
      where: {
        sprintId: sprint.id,
        isDeleted: false,
      },

      order: {
        createdAt: 'ASC',
      },
    });

    // ========================================
    // NO TASK
    // ========================================

    if (tasks.length === 0) {
      throw new ConflictException({
        code: 'SPRINT_HAS_NO_TASKS',

        message: 'Sprint chưa có Task nên không thể hoàn thành.',
      });
    }

    // ========================================
    // UNFINISHED TASKS
    // ========================================

    const unfinishedTasks = tasks.filter((task) => {
      const status = task.status?.toString().toUpperCase();

      const progress = Number(task.progress ?? 0);

      return status !== TaskStatus.DONE || progress < 100;
    });

    if (unfinishedTasks.length > 0) {
      throw new ConflictException({
        code: 'SPRINT_HAS_UNFINISHED_TASKS',

        message: `Sprint còn ${unfinishedTasks.length} Task chưa hoàn thành.`,

        unfinishedTasks: unfinishedTasks.map((task) => ({
          id: task.id,

          title: task.title ?? 'Task chưa đặt tên',

          status: task.status,

          progress: Number(task.progress ?? 0),
        })),
      });
    }

    // ========================================
    // 2. DEPENDENCY CHECK
    // ========================================
    //
    // Dù Task đã DONE, vẫn kiểm tra dependency
    // để bảo vệ dữ liệu legacy / dữ liệu bị sửa
    // trực tiếp DB.
    // ========================================

    const dependencyStatuses = await Promise.all(
      tasks.map(async (task) => {
        const status = await this.taskDependenciesService.getDependencyStatus(
          task.id,
        );

        return {
          task,

          status,
        };
      }),
    );

    const blockedByDependencies = dependencyStatuses.filter(
      (item) => item.status.isBlockedByDependency,
    );

    if (blockedByDependencies.length > 0) {
      throw new ConflictException({
        code: 'SPRINT_HAS_UNFINISHED_DEPENDENCIES',

        message:
          'Sprint vẫn còn Task đang phụ thuộc vào prerequisite chưa hoàn thành.',

        tasks: blockedByDependencies.map((item) => ({
          id: item.task.id,

          title: item.task.title ?? 'Task chưa đặt tên',

          unfinishedDependencies: item.status.unfinishedDependencies,
        })),
      });
    }

    // ========================================
    // 3. ALLOCATION CHECK
    // ========================================

    const allocations = await this.userSprintRepo.find({
      where: {
        sprintId: sprint.id,
      },
    });

    const unresolvedAllocations = allocations.filter(
      (allocation) => allocation.status !== UserSprintStatus.RELEASED,
    );

    if (unresolvedAllocations.length > 0) {
      throw new ConflictException({
        code: 'SPRINT_HAS_ACTIVE_ALLOCATIONS',

        message: 'Sprint vẫn còn allocation chưa được RELEASED.',

        allocations: unresolvedAllocations.map((allocation) => ({
          id: allocation.id,

          userId: allocation.userId,

          status: allocation.status,

          percitant: Number(allocation.percitant ?? 0),
        })),
      });
    }

    return true;
  }

  // ==========================================
  // CANCEL PREPARATION
  // ==========================================

  private async prepareSprintCancellation(sprint: Sprint) {
    const allocations = await this.userSprintRepo.find({
      where: {
        sprintId: sprint.id,
      },
    });

    // ========================================
    // ASSIGNED RESOURCE
    // ========================================
    //
    // Không tự RELEASE ở đây vì Release
    // còn gắn với performance review.
    //
    // PM phải Release nhân sự trước.
    // ========================================

    const assignedAllocations = allocations.filter(
      (allocation) => allocation.status === UserSprintStatus.ASSIGNED,
    );

    if (assignedAllocations.length > 0) {
      throw new ConflictException({
        code: 'SPRINT_HAS_ASSIGNED_RESOURCES',

        message:
          'Sprint còn nhân sự ASSIGNED. Hãy Release nhân sự trước khi hủy Sprint.',

        allocations: assignedAllocations.map((allocation) => ({
          id: allocation.id,

          userId: allocation.userId,

          percitant: Number(allocation.percitant ?? 0),
        })),
      });
    }

    // ========================================
    // CLEAN REQUESTED / PENDING
    // ========================================
    //
    // user_sprint hiện chưa có CANCELLED status.
    //
    // Nếu giữ REQUESTED/PENDING sau khi Sprint
    // CANCELLED thì Capacity Engine vẫn có thể
    // tính các request này.
    //
    // Vì vậy khi hủy Sprint:
    // REQUESTED + PENDING_APPROVAL được cleanup.
    // RELEASED vẫn giữ để làm lịch sử.
    // ========================================

    await this.userSprintRepo.delete({
      sprintId: sprint.id,

      status: In([
        UserSprintStatus.REQUESTED,
        UserSprintStatus.PENDING_APPROVAL,
      ]) as any,
    });
  }

  // ==========================================
  // REMOVE / SOFT DELETE
  // ==========================================

  async remove(id: string) {
    const sprint = await this.findOne(id);

    const status = this.normalizeStatus(sprint.status);

    if (status === 'COMPLETED') {
      throw new ConflictException({
        code: 'COMPLETED_SPRINT_CANNOT_DELETE',

        message: 'Sprint đã hoàn thành không thể bị xóa.',
      });
    }

    if (status === 'ACTIVE') {
      throw new ConflictException({
        code: 'ACTIVE_SPRINT_CANNOT_DELETE',

        message:
          'Sprint đang ACTIVE không thể bị xóa trực tiếp. Hãy hủy Sprint trước.',
      });
    }

    sprint.isDeleted = true;

    sprint.deletedAt = new Date();

    await this.sprintRepo.save(sprint);

    return {
      success: true,

      id: sprint.id,

      message: 'Đã xóa Sprint.',
    };
  }

  // ==========================================
  // GET PROJECT
  // ==========================================

  private async getProjectOrFail(projectId: string) {
    const project = await this.projectRepo.findOne({
      where: {
        id: projectId,
        isDeleted: false,
      },
    });

    if (!project) {
      throw new NotFoundException({
        code: 'PROJECT_NOT_FOUND',

        message: 'Không tìm thấy Project của Sprint.',
      });
    }

    return project;
  }

  // ==========================================
  // SPRINT DATE VALIDATION
  // ==========================================

  private validateSprintDates(
    startDate: string | Date,

    endDate: string | Date,
  ) {
    const start = dayjs(startDate);

    const end = dayjs(endDate);

    if (!start.isValid() || !end.isValid()) {
      throw new BadRequestException({
        code: 'INVALID_SPRINT_DATE',

        message: 'Ngày bắt đầu hoặc ngày kết thúc Sprint không hợp lệ.',
      });
    }

    if (!start.isBefore(end)) {
      throw new BadRequestException({
        code: 'INVALID_SPRINT_TIMELINE',

        message: 'Ngày bắt đầu Sprint phải nhỏ hơn ngày kết thúc.',
      });
    }
  }

  // ==========================================
  // PROJECT TIMELINE VALIDATION
  // ==========================================

  private validateSprintInsideProject(
    startDate: string | Date,

    endDate: string | Date,

    project: Project,
  ) {
    const sprintStart = dayjs(startDate);

    const sprintEnd = dayjs(endDate);

    const projectStart = dayjs(project.startDate);

    const projectEnd = dayjs(project.endDate);

    if (!projectStart.isValid() || !projectEnd.isValid()) {
      throw new ConflictException({
        code: 'INVALID_PROJECT_TIMELINE',

        message: 'Timeline của Project không hợp lệ.',
      });
    }

    if (sprintStart.isBefore(projectStart, 'day')) {
      throw new ConflictException({
        code: 'SPRINT_OUTSIDE_PROJECT_TIMELINE',

        message: 'Sprint không được bắt đầu trước ngày bắt đầu Project.',
      });
    }

    if (sprintEnd.isAfter(projectEnd, 'day')) {
      throw new ConflictException({
        code: 'SPRINT_OUTSIDE_PROJECT_TIMELINE',

        message: 'Sprint không được kết thúc sau ngày kết thúc Project.',
      });
    }
  }

  // ==========================================
  // ATTENDANT
  // ==========================================

  private normalizeAttendant(
    attendant: string | string[] | null | undefined,
  ): string[] {
    if (attendant === undefined || attendant === null) {
      return [];
    }

    if (Array.isArray(attendant)) {
      return attendant.map((item) => String(item).trim()).filter(Boolean);
    }

    const value = String(attendant).trim();

    if (!value) {
      return [];
    }

    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // Không phải JSON string.
    }

    return [value];
  }

  // ==========================================
  // INITIAL STATUS
  // ==========================================

  private determineInitialStatus(_startDate: string | Date) {
    // Sprint luôn bắt đầu ở UPCOMING.
    //
    // Đến ngày bắt đầu KHÔNG có nghĩa
    // Sprint tự động ACTIVE.
    //
    // PM phải chủ động Start Sprint
    // thông qua:
    //
    // PATCH /sprints/:id/status
    //
    // Khi đó Readiness Guard mới chạy.
    return 'upcoming';
  }
  private async assertTasksInsideNewSprintTimeline(
    sprintId: string,
    startDate: string | Date,
    endDate: string | Date,
  ) {
    const tasks = await this.taskRepo.find({
      where: {
        sprintId,
        isDeleted: false,
      },

      order: {
        createdAt: 'ASC',
      },
    });

    const newStart = dayjs(startDate);

    const newEnd = dayjs(endDate);

    const invalidTasks = tasks
      .filter((task) => {
        // Legacy Task chưa có timeline:
        // không block việc edit Sprint ở bước này.
        if (!task.startDate || !task.endDate) {
          return false;
        }

        const taskStart = dayjs(task.startDate);

        const taskEnd = dayjs(task.endDate);

        return (
          taskStart.isBefore(newStart, 'day') || taskEnd.isAfter(newEnd, 'day')
        );
      })
      .map((task) => ({
        id: task.id,

        title: task.title ?? 'Task chưa đặt tên',

        startDate: task.startDate,

        endDate: task.endDate,

        status: task.status,

        progress: Number(task.progress ?? 0),
      }));

    if (invalidTasks.length > 0) {
      throw new ConflictException({
        code: 'SPRINT_TIMELINE_TASK_CONFLICT',

        message: `Timeline mới làm ${invalidTasks.length} Task nằm ngoài Sprint.`,

        requestedTimeline: {
          startDate,
          endDate,
        },

        invalidTasks,
      });
    }

    return true;
  }

  private async assertAllocationsSafeForNewTimeline(
    sprintId: string,
    startDate: string | Date,
    endDate: string | Date,
  ) {
    const activeStatuses = [
      UserSprintStatus.REQUESTED,
      UserSprintStatus.PENDING_APPROVAL,
      UserSprintStatus.ASSIGNED,
    ];

    // ==========================================
    // ALLOCATION CỦA SPRINT ĐANG ĐƯỢC SỬA
    // ==========================================

    const currentAllocations = await this.userSprintRepo
      .createQueryBuilder('allocation')
      .where('allocation.sprintId = :sprintId', {
        sprintId,
      })
      .andWhere('allocation.status IN (:...statuses)', {
        statuses: activeStatuses,
      })
      .getMany();

    if (currentAllocations.length === 0) {
      return true;
    }

    const userIds = [
      ...new Set(currentAllocations.map((allocation) => allocation.userId)),
    ];

    // ==========================================
    // CÁC ALLOCATION KHÁC CÓ THỂ OVERLAP
    // VỚI TIMELINE MỚI
    // ==========================================

    const otherAllocations = await this.userSprintRepo
      .createQueryBuilder('allocation')
      .innerJoinAndSelect('allocation.sprint', 'otherSprint')
      .where('allocation.userId IN (:...userIds)', {
        userIds,
      })
      .andWhere('allocation.sprintId != :sprintId', {
        sprintId,
      })
      .andWhere('allocation.status IN (:...statuses)', {
        statuses: activeStatuses,
      })
      .andWhere('otherSprint.isDeleted = :isDeleted', {
        isDeleted: false,
      })
      .andWhere('otherSprint.status != :cancelledStatus', {
        cancelledStatus: 'cancelled',
      })
      // Overlap với timeline MỚI:
      //
      // other.start <= new.end
      // AND
      // other.end >= new.start
      .andWhere('otherSprint.startDate <= :newEndDate', {
        newEndDate: endDate,
      })
      .andWhere('otherSprint.endDate >= :newStartDate', {
        newStartDate: startDate,
      })
      .getMany();

    // ==========================================
    // CHECK TỪNG USER
    // ==========================================

    const conflicts = currentAllocations
      .map((currentAllocation) => {
        const userOtherAllocations = otherAllocations.filter(
          (allocation) => allocation.userId === currentAllocation.userId,
        );

        const otherPercentage = userOtherAllocations.reduce(
          (total, allocation) => total + Number(allocation.percitant ?? 0),
          0,
        );

        const currentPercentage = Number(currentAllocation.percitant ?? 0);

        const totalPercentage = currentPercentage + otherPercentage;

        if (totalPercentage <= 100) {
          return null;
        }

        return {
          userId: currentAllocation.userId,

          currentAllocation: {
            allocationId: currentAllocation.id,

            percentage: currentPercentage,

            status: currentAllocation.status,
          },

          otherAllocation: otherPercentage,

          totalAllocation: totalPercentage,

          overBy: totalPercentage - 100,

          conflicts: userOtherAllocations.map((allocation) => ({
            allocationId: allocation.id,

            sprintId: allocation.sprintId,

            sprintName: allocation.sprint?.name ?? null,

            percentage: Number(allocation.percitant ?? 0),

            status: allocation.status,

            startDate: allocation.sprint?.startDate ?? null,

            endDate: allocation.sprint?.endDate ?? null,
          })),
        };
      })
      .filter((item) => item !== null);

    if (conflicts.length > 0) {
      throw new ConflictException({
        code: 'SPRINT_TIMELINE_ALLOCATION_CONFLICT',

        message:
          'Timeline mới làm một hoặc nhiều nhân sự bị vượt quá 100% allocation.',

        requestedTimeline: {
          startDate,
          endDate,
        },

        conflicts,
      });
    }

    return true;
  }
  // ==========================================
  // NORMALIZE STATUS
  // ==========================================
  private async assertNoSprintOverlap(
    projectId: string,
    startDate: string | Date,
    endDate: string | Date,
    excludeSprintId?: string,
  ) {
    const query = this.sprintRepo
      .createQueryBuilder('sprint')
      .where('sprint.projectId = :projectId', {
        projectId,
      })
      .andWhere('sprint.isDeleted = :isDeleted', {
        isDeleted: false,
      })
      // Sprint đã CANCELLED không còn chiếm timeline.
      .andWhere('sprint.status != :cancelledStatus', {
        cancelledStatus: 'cancelled',
      })
      // Hai khoảng thời gian overlap khi:
      //
      // existing.start <= new.end
      // AND
      // existing.end >= new.start
      .andWhere('sprint.startDate <= :endDate', {
        endDate,
      })
      .andWhere('sprint.endDate >= :startDate', {
        startDate,
      });

    if (excludeSprintId) {
      query.andWhere('sprint.id != :excludeSprintId', {
        excludeSprintId,
      });
    }

    const conflictingSprint = await query
      .orderBy('sprint.startDate', 'ASC')
      .getOne();

    if (conflictingSprint) {
      throw new ConflictException({
        code: 'SPRINT_TIMELINE_OVERLAP',

        message: `Sprint bị trùng thời gian với "${conflictingSprint.name}".`,

        conflict: {
          sprintId: conflictingSprint.id,

          sprintName: conflictingSprint.name,

          startDate: conflictingSprint.startDate,

          endDate: conflictingSprint.endDate,

          status: conflictingSprint.status,
        },
      });
    }

    return true;
  }

  private async assertSprintTimelineChangeSafe(
    sprint: Sprint,
    startDate: string | Date,
    endDate: string | Date,
  ) {
    // ==========================================
    // TASK IMPACT
    // ==========================================

    await this.assertTasksInsideNewSprintTimeline(
      sprint.id,
      startDate,
      endDate,
    );

    // ==========================================
    // RESOURCE / CAPACITY IMPACT
    // ==========================================

    await this.assertAllocationsSafeForNewTimeline(
      sprint.id,
      startDate,
      endDate,
    );

    return true;
  }
  private normalizeStatus(status?: string) {
    return (status ?? '').toString().toUpperCase();
  }
}
