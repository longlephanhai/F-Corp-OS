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
      this.assertSprintCanStart(sprint);
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

  private assertSprintCanStart(sprint: Sprint) {
    if (!sprint.startDate) {
      throw new ConflictException({
        code: 'SPRINT_START_DATE_REQUIRED',

        message:
          'Sprint chưa có ngày bắt đầu nên không thể chuyển sang ACTIVE.',
      });
    }

    const startDate = dayjs(sprint.startDate);

    if (!startDate.isValid()) {
      throw new ConflictException({
        code: 'INVALID_SPRINT_START_DATE',

        message: 'Ngày bắt đầu Sprint không hợp lệ.',
      });
    }

    // Chỉ so sánh theo ngày.
    //
    // Ví dụ startDate là hôm nay:
    // vẫn được phép Start.
    if (dayjs().isBefore(startDate, 'day')) {
      throw new ConflictException({
        code: 'SPRINT_NOT_STARTED_YET',

        message:
          'Chưa đến ngày bắt đầu Sprint nên chưa thể chuyển sang ACTIVE.',

        startDate: sprint.startDate,
      });
    }
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

  private determineInitialStatus(startDate: string | Date) {
    const start = dayjs(startDate);

    if (dayjs().isBefore(start, 'day')) {
      return 'upcoming';
    }

    return 'active';
  }

  // ==========================================
  // NORMALIZE STATUS
  // ==========================================

  private normalizeStatus(status?: string) {
    return (status ?? '').toString().toUpperCase();
  }
}
