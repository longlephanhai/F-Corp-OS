import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskPriority, TaskStatus } from './entities/task.entity';

import { UpdateTaskLifecycleDto } from './dto/update-task-lifecycle.dto';
import { User } from '../users/entities/user.entity';
import { TaskDependenciesService } from '../task-dependencies/task-dependencies.service';
import { Sprint } from '../sprints/entities/sprint.entity';
import { UpdateTaskTimelineDto } from './dto/update-task-timeline.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CarryOverTaskDto } from './dto/carry-over-task.dto';
import {
  UserSprint,
  UserSprintStatus,
} from '../user-sprints/entities/user-sprint.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    @InjectRepository(Sprint)
    private readonly sprintRepo: Repository<Sprint>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(UserSprint)
    private readonly userSprintRepo: Repository<UserSprint>,

    private readonly taskDependenciesService: TaskDependenciesService,
  ) {}

  async getTasksBySprint(sprintId: string) {
    return await this.taskRepo.find({
      where: { sprintId, isDeleted: false },
      order: { createdAt: 'DESC' },
    });
  }

  // 4. Tạo Task và gán kĩ năng yêu cầu (Required Skills JSON)
  async createTask(data: any) {
    Logger.debug('tao là khánh', data);
    if (!data.sprintId) {
      throw new BadRequestException({
        code: 'SPRINT_REQUIRED',
        message: 'Task phải thuộc một Sprint.',
      });
    }

    const sprint = await this.assertSprintMutable(data.sprintId);
    this.validateTaskTimeline(data.startDate, data.endDate, sprint);
    if (data.userId) {
      await this.assertUserAssignedToSprint(data.sprintId, data.userId);
    }
    const newTask = this.taskRepo.create({
      sprintId: data.sprintId,

      userId: data.userId ?? null,

      title: data.title ?? null,

      description: data.description ?? null,

      priority: data.priority ?? TaskPriority.MEDIUM,

      status: TaskStatus.TODO,

      progress: 0,

      requiredSkills: data.requiredSkills ?? [],

      startDate: data.startDate,

      endDate: data.endDate,

      budgetRate: data.budgetRate,
    });

    return await this.taskRepo.save(newTask);
  }

  async updateTask(taskId: string, data: UpdateTaskDto) {
    // ==========================================
    // 1. TASK
    // ==========================================

    const task = await this.taskRepo.findOne({
      where: {
        id: taskId,
        isDeleted: false,
      },
    });

    if (!task) {
      throw new NotFoundException({
        code: 'TASK_NOT_FOUND',
        message: 'Không tìm thấy Task.',
      });
    }

    // ==========================================
    // 2. EMPTY UPDATE
    // ==========================================

    const hasUpdate =
      data.title !== undefined ||
      data.description !== undefined ||
      data.priority !== undefined ||
      data.budgetRate !== undefined ||
      data.startDate !== undefined ||
      data.endDate !== undefined ||
      data.requiredSkills !== undefined;

    if (!hasUpdate) {
      throw new BadRequestException({
        code: 'EMPTY_TASK_UPDATE',
        message: 'Không có dữ liệu Task cần cập nhật.',
      });
    }

    // ==========================================
    // 3. SPRINT READ-ONLY
    // ==========================================

    const sprint = await this.assertSprintMutable(task.sprintId);

    // ==========================================
    // 4. DONE TASK
    // ==========================================

    if (task.status === TaskStatus.DONE) {
      throw new ConflictException({
        code: 'DONE_TASK_EDIT_LOCKED',

        message: 'Task đã hoàn thành nên không thể chỉnh sửa thông tin.',
      });
    }

    // ==========================================
    // 5. TITLE
    // ==========================================

    let normalizedTitle: string | undefined;

    if (data.title !== undefined) {
      normalizedTitle = data.title.trim();

      if (!normalizedTitle) {
        throw new BadRequestException({
          code: 'INVALID_TASK_TITLE',

          message: 'Tên Task không được để trống.',
        });
      }
    }

    // ==========================================
    // 6. REQUIRED SKILLS
    // ==========================================

    if (data.requiredSkills !== undefined) {
      const skillIds = data.requiredSkills.map((skill) => skill.skill_id);

      const uniqueSkillIds = new Set(skillIds);

      if (uniqueSkillIds.size !== skillIds.length) {
        throw new ConflictException({
          code: 'DUPLICATE_REQUIRED_SKILL',

          message:
            'Một kỹ năng không được xuất hiện nhiều lần trong Required Skills.',
        });
      }
    }

    // ==========================================
    // 7. TIMELINE
    // ==========================================

    const timelineChanged =
      data.startDate !== undefined || data.endDate !== undefined;

    const nextStartDate = data.startDate ?? task.startDate;

    const nextEndDate = data.endDate ?? task.endDate;

    if (timelineChanged) {
      // Task phải tiếp tục nằm trong Sprint.
      this.validateTaskTimeline(nextStartDate, nextEndDate, sprint);

      // Không được phá dependency hiện tại.
      await this.taskDependenciesService.assertTaskTimelineChangeSafe(
        task.id,
        nextStartDate,
        nextEndDate,
      );
    }

    // ==========================================
    // 8. APPLY UPDATE
    //
    // Chỉ mutate entity SAU KHI mọi validation pass.
    // ==========================================

    if (normalizedTitle !== undefined) {
      task.title = normalizedTitle;
    }

    if (data.description !== undefined) {
      task.description = data.description?.trim() || null;
    }

    if (data.priority !== undefined) {
      task.priority = data.priority;
    }

    if (data.budgetRate !== undefined) {
      task.budgetRate = data.budgetRate;
    }

    if (data.requiredSkills !== undefined) {
      task.requiredSkills = data.requiredSkills;
    }

    if (data.startDate !== undefined) {
      task.startDate = new Date(data.startDate);
    }

    if (data.endDate !== undefined) {
      task.endDate = new Date(data.endDate);
    }

    // ==========================================
    // 9. SAVE ONCE
    // ==========================================

    return await this.taskRepo.save(task);
  }
  async carryOverTask(taskId: string, data: CarryOverTaskDto) {
    // ==========================================
    // SOURCE TASK
    // ==========================================

    const sourceTask = await this.taskRepo.findOne({
      where: {
        id: taskId,

        isDeleted: false,
      },
    });

    if (!sourceTask) {
      throw new NotFoundException({
        code: 'TASK_NOT_FOUND',

        message: 'Không tìm thấy Task.',
      });
    }

    // ==========================================
    // SOURCE SPRINT
    // ==========================================

    const sourceSprint = await this.sprintRepo.findOne({
      where: {
        id: sourceTask.sprintId,

        isDeleted: false,
      },
    });

    if (!sourceSprint) {
      throw new NotFoundException({
        code: 'SPRINT_NOT_FOUND',

        message: 'Không tìm thấy Sprint nguồn.',
      });
    }

    const sourceSprintStatus = (sourceSprint.status ?? '')
      .toString()
      .toUpperCase();

    if (sourceSprintStatus !== 'ACTIVE') {
      throw new ConflictException({
        code: 'CARRY_OVER_SOURCE_NOT_ACTIVE',

        message: 'Chỉ Task của Sprint ACTIVE mới được Carry-over.',

        sprintStatus: sourceSprint.status,
      });
    }

    // ==========================================
    // TASK DONE
    // ==========================================

    const taskStatus = (sourceTask.status ?? '').toString().toUpperCase();

    const progress = Number(sourceTask.progress ?? 0);

    if (taskStatus === TaskStatus.DONE || progress >= 100) {
      throw new ConflictException({
        code: 'DONE_TASK_CANNOT_CARRY_OVER',

        message: 'Task đã hoàn thành không cần Carry-over.',
      });
    }

    // ==========================================
    // TARGET SPRINT
    // ==========================================

    if (data.targetSprintId === sourceSprint.id) {
      throw new BadRequestException({
        code: 'INVALID_CARRY_OVER_TARGET',

        message: 'Sprint đích phải khác Sprint hiện tại.',
      });
    }

    const targetSprint = await this.sprintRepo.findOne({
      where: {
        id: data.targetSprintId,

        isDeleted: false,
      },
    });

    if (!targetSprint) {
      throw new NotFoundException({
        code: 'TARGET_SPRINT_NOT_FOUND',

        message: 'Không tìm thấy Sprint đích.',
      });
    }

    // ==========================================
    // SAME PROJECT
    // ==========================================

    if (sourceSprint.projectId !== targetSprint.projectId) {
      throw new ConflictException({
        code: 'CROSS_PROJECT_CARRY_OVER',

        message:
          'Chỉ được Carry-over Task sang Sprint khác trong cùng Project.',
      });
    }

    // ==========================================
    // TARGET MUST BE UPCOMING
    // ==========================================

    const targetStatus = (targetSprint.status ?? '').toString().toUpperCase();

    if (targetStatus !== 'UPCOMING') {
      throw new ConflictException({
        code: 'CARRY_OVER_TARGET_NOT_UPCOMING',

        message: 'Sprint đích phải ở trạng thái UPCOMING.',

        targetSprintStatus: targetSprint.status,
      });
    }

    // ==========================================
    // MUST ACTUALLY BE A NEXT SPRINT
    // ==========================================

    const sourceEnd = new Date(sourceSprint.endDate).getTime();

    const targetStart = new Date(targetSprint.startDate).getTime();

    if (targetStart <= sourceEnd) {
      throw new ConflictException({
        code: 'INVALID_NEXT_SPRINT',

        message: 'Sprint đích phải bắt đầu sau Sprint hiện tại.',
      });
    }

    // ==========================================
    // NEW TASK TIMELINE
    // ==========================================

    this.validateTaskTimeline(data.startDate, data.endDate, targetSprint);

    // ==========================================
    // DEPENDENCY IMPACT
    // ==========================================

    await this.taskDependenciesService.assertTaskCanCarryOver(sourceTask.id);

    // ==========================================
    // OWNER
    //
    // Chỉ giữ owner nếu user đã ASSIGNED
    // trong Sprint đích.
    // ==========================================

    let targetUserId: string | null = null;

    if (sourceTask.userId) {
      const targetAllocation = await this.userSprintRepo.findOne({
        where: {
          sprintId: targetSprint.id,

          userId: sourceTask.userId,

          status: UserSprintStatus.ASSIGNED,
        },
      });

      if (targetAllocation) {
        targetUserId = sourceTask.userId;
      }
    }

    const carriedAt = new Date();

    // ==========================================
    // TRANSACTION
    // ==========================================

    return await this.taskRepo.manager.transaction(async (manager) => {
      const taskRepo = manager.getRepository(Task);

      // ======================================
      // CREATE TARGET TASK
      // ======================================

      const targetTask = taskRepo.create({
        sprintId: targetSprint.id,

        userId: targetUserId,

        title: sourceTask.title,

        description: sourceTask.description,

        priority: sourceTask.priority,

        // New Sprint = new execution cycle.
        status: TaskStatus.TODO,

        progress: 0,

        requiredSkills: sourceTask.requiredSkills
          ? [...sourceTask.requiredSkills]
          : [],

        startDate: new Date(data.startDate),

        endDate: new Date(data.endDate),

        budgetRate: sourceTask.budgetRate,

        isDeleted: false,
      });

      const savedTarget = await taskRepo.save(targetTask);

      // ======================================
      // LINK TARGET → SOURCE
      // ======================================

      savedTarget.carryOverMeta = {
        sourceTaskId: sourceTask.id,

        sourceSprintId: sourceSprint.id,

        carriedInAt: carriedAt.toISOString(),
      };

      await taskRepo.save(savedTarget);

      // ======================================
      // ARCHIVE SOURCE
      // ======================================

      sourceTask.carryOverMeta = {
        ...(sourceTask.carryOverMeta ?? {}),

        targetTaskId: savedTarget.id,

        targetSprintId: targetSprint.id,

        carriedOutAt: carriedAt.toISOString(),
      };

      sourceTask.isDeleted = true;

      sourceTask.deletedAt = carriedAt;

      await taskRepo.save(sourceTask);

      return {
        sourceTaskId: sourceTask.id,

        sourceSprintId: sourceSprint.id,

        targetSprintId: targetSprint.id,

        targetTask: savedTarget,

        ownerPreserved: Boolean(targetUserId),

        previousOwnerId: sourceTask.userId ?? null,
      };
    });
  }
  async getTaskCarryOverHistory(taskId: string) {
    // ==========================================
    // CURRENT TASK
    //
    // Không filter isDeleted vì Task source
    // có thể đã archived.
    // ==========================================

    const currentTask = await this.taskRepo.findOne({
      where: {
        id: taskId,
      },
    });

    if (!currentTask) {
      throw new NotFoundException({
        code: 'TASK_NOT_FOUND',

        message: 'Không tìm thấy Task.',
      });
    }

    // ==========================================
    // FIND ROOT
    // ==========================================

    let rootTask = currentTask;

    const visited = new Set<string>();

    for (let depth = 0; depth < 50; depth++) {
      if (visited.has(rootTask.id)) {
        break;
      }

      visited.add(rootTask.id);

      const meta = rootTask.carryOverMeta;

      if (!meta) {
        break;
      }

      let sourceTaskId = meta.sourceTaskId;

      // ========================================
      // LEGACY TARGET FORMAT
      // ========================================

      if (!sourceTaskId && meta.direction === 'TARGET') {
        sourceTaskId = meta.linkedTaskId;
      }

      if (!sourceTaskId) {
        break;
      }

      const sourceTask = await this.taskRepo.findOne({
        where: {
          id: sourceTaskId,
        },
      });

      if (!sourceTask) {
        break;
      }

      rootTask = sourceTask;
    }

    // ==========================================
    // WALK ROOT → LATEST
    // ==========================================

    const history: Array<{
      taskId: string;

      sprintId: string;

      sprintName: string | null;

      title: string | null;

      status: string | null;

      progress: number;

      userId: string | null;

      isDeleted: boolean;

      startDate: Date | null;

      endDate: Date | null;

      carriedInAt: string | null;

      carriedOutAt: string | null;

      isCurrent: boolean;
    }> = [];

    let task: Task | null = rootTask;

    const chainVisited = new Set<string>();

    for (let depth = 0; task && depth < 50; depth++) {
      if (chainVisited.has(task.id)) {
        break;
      }

      chainVisited.add(task.id);

      const sprint = await this.sprintRepo.findOne({
        where: {
          id: task.sprintId,
        },
      });

      const meta = task.carryOverMeta;

      history.push({
        taskId: task.id,

        sprintId: task.sprintId,

        sprintName: sprint?.name ?? null,

        title: task.title ?? null,

        status: task.status ?? null,

        progress: Number(task.progress ?? 0),

        userId: task.userId ?? null,

        isDeleted: Boolean(task.isDeleted),

        startDate: task.startDate ?? null,

        endDate: task.endDate ?? null,

        carriedInAt:
          meta?.carriedInAt ??
          (meta?.direction === 'TARGET' ? (meta.carriedAt ?? null) : null),

        carriedOutAt:
          meta?.carriedOutAt ??
          (meta?.direction === 'SOURCE' ? (meta.carriedAt ?? null) : null),

        isCurrent: task.id === currentTask.id,
      });

      let nextTaskId = meta?.targetTaskId;

      // ========================================
      // LEGACY SOURCE FORMAT
      // ========================================

      if (!nextTaskId && meta?.direction === 'SOURCE') {
        nextTaskId = meta.linkedTaskId;
      }

      if (!nextTaskId) {
        break;
      }

      task = await this.taskRepo.findOne({
        where: {
          id: nextTaskId,
        },
      });
    }

    return {
      taskId: currentTask.id,

      hasCarryOverHistory:
        history.length > 1 || Boolean(currentTask.carryOverMeta),

      totalVersions: history.length,

      history,
    };
  }
  async removeTask(taskId: string) {
    // ==========================================
    // 1. TASK
    // ==========================================

    const task = await this.taskRepo.findOne({
      where: {
        id: taskId,

        isDeleted: false,
      },
    });

    if (!task) {
      throw new NotFoundException({
        code: 'TASK_NOT_FOUND',

        message: 'Không tìm thấy Task.',
      });
    }

    // ==========================================
    // 2. SPRINT
    // ==========================================

    await this.assertSprintMutable(task.sprintId);

    // ==========================================
    // 3. DONE TASK
    // ==========================================

    const status = (task.status ?? '').toString().toUpperCase();

    const progress = Number(task.progress ?? 0);

    if (status === TaskStatus.DONE || progress >= 100) {
      throw new ConflictException({
        code: 'DONE_TASK_CANNOT_DELETE',

        message: 'Task đã hoàn thành không thể bị xóa.',

        taskId: task.id,

        status: task.status,

        progress,
      });
    }

    // ==========================================
    // 4. DEPENDENCY IMPACT
    // ==========================================

    await this.taskDependenciesService.prepareTaskDeletion(task.id);

    // ==========================================
    // 5. SOFT DELETE
    // ==========================================

    task.isDeleted = true;

    await this.taskRepo.save(task);

    return {
      success: true,

      id: task.id,

      message: 'Đã lưu trữ Task.',
    };
  }
  async getMatchingCandidates(taskId: string) {
    // ==========================================
    // TASK
    // ==========================================

    const task = await this.taskRepo.findOne({
      where: {
        id: taskId,
        isDeleted: false,
      },
    });

    if (!task) {
      throw new NotFoundException({
        code: 'TASK_NOT_FOUND',
        message: 'Không tìm thấy Task.',
      });
    }

    // ==========================================
    // ASSIGNED USERS IN CURRENT SPRINT
    // ==========================================

    const assignedAllocations = await this.userSprintRepo.find({
      where: {
        sprintId: task.sprintId,
        status: UserSprintStatus.ASSIGNED,
      },
    });

    // Sprint chưa có ai được ASSIGNED
    // => không có candidate để gán Task
    if (assignedAllocations.length === 0) {
      return [];
    }

    const assignedUserIds = assignedAllocations.map(
      (allocation) => allocation.userId,
    );

    // ==========================================
    // CURRENT TASK WORKLOAD
    // ==========================================
    //
    // Chỉ tính Task trong chính Sprint này
    // và chưa DONE.
    // ==========================================

    const assignedTasks = await this.taskRepo
      .createQueryBuilder('task')
      .where('task.sprintId = :sprintId', {
        sprintId: task.sprintId,
      })
      .andWhere('task.isDeleted = :isDeleted', {
        isDeleted: false,
      })
      .andWhere('task.userId IN (:...assignedUserIds)', {
        assignedUserIds,
      })
      .getMany();

    const unfinishedAssignedTasks = assignedTasks.filter((assignedTask) => {
      const status = (assignedTask.status ?? '').toString().toUpperCase();

      const progress = Number(assignedTask.progress ?? 0);

      return status !== TaskStatus.DONE || progress < 100;
    });
    // ==========================================
    // USERS + SKILLS
    // Chỉ lấy user đã ASSIGNED vào Sprint
    // ==========================================

    const users = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect(
        'user.userSkills',
        'userSkill',
        'userSkill.isDeleted = :isDeleted',
        {
          isDeleted: false,
        },
      )
      .leftJoinAndSelect('userSkill.skill', 'skill')
      .where('user.isDeleted = :isDeleted', {
        isDeleted: false,
      })
      .andWhere('user.id IN (:...assignedUserIds)', {
        assignedUserIds,
      })
      .select([
        'user.id',
        'user.fullName',
        'user.title',
        'user.status',
        'user.costRate',

        'userSkill.id',
        'userSkill.skillId',
        'userSkill.level',

        'skill.id',
        'skill.name',
      ])
      .getMany();

    if (users.length === 0) {
      return [];
    }

    // ==========================================
    // TASK SKILL REQUIREMENTS
    // ==========================================

    const requirements = (task.requiredSkills ?? []).map(
      (requirement: any) => ({
        identifier: requirement.skill_id ?? requirement.skill,

        label: requirement.skill ?? requirement.skill_id ?? 'Chưa xác định',

        minLevel: Number(requirement.min_level ?? requirement.level ?? 1),
      }),
    );

    // ==========================================
    // BUILD CANDIDATES
    // ==========================================

    return users
      .map((user) => {
        // ======================================
        // SKILL MATCHING
        // ======================================

        const matchedSkills = requirements
          .filter((requirement) =>
            user.userSkills.some(
              (userSkill) =>
                (userSkill.skillId === requirement.identifier ||
                  userSkill.skill?.name === requirement.identifier) &&
                Number(userSkill.level ?? 0) >= requirement.minLevel,
            ),
          )
          .map((requirement) => requirement.label);

        const missingSkills = requirements
          .filter((requirement) => !matchedSkills.includes(requirement.label))
          .map((requirement) => requirement.label);

        const matchScore =
          requirements.length > 0
            ? Math.round((matchedSkills.length / requirements.length) * 100)
            : 0;

        // ======================================
        // SPRINT ALLOCATION
        // ======================================

        const sprintAllocation = assignedAllocations.find(
          (allocation) => allocation.userId === user.id,
        );

        // ==========================================
        // WORKLOAD
        // ==========================================

        const userOwnedTasks = unfinishedAssignedTasks.filter(
          (ownedTask) =>
            ownedTask.userId === user.id && ownedTask.id !== task.id,
        );

        const activeTaskCount = userOwnedTasks.length;

        const allocationPercent = Number(sprintAllocation?.percitant ?? 0);

        const workloadLimit =
          this.calculateTaskWorkloadLimit(allocationPercent);

        const remainingTaskSlots = Math.max(0, workloadLimit - activeTaskCount);

        const workloadPercent =
          workloadLimit > 0
            ? Math.round((activeTaskCount / workloadLimit) * 100)
            : 0;

        const isAtTaskCapacity = activeTaskCount >= workloadLimit;

        const isTaskOverloaded = activeTaskCount > workloadLimit;
        // ======================================
        // RESULT
        // ======================================

        return {
          id: user.id,

          fullName: user.fullName,

          title: user.title ?? 'Chưa cập nhật vị trí',

          // Giữ employee status nếu FE cần hiển thị
          employeeStatus: user.status,

          // Giữ status cũ nếu TaskCandidate FE đang dùng field này
          status:
            user.status === 'AVAILABLE'
              ? 'available'
              : user.status === 'BENCH'
                ? 'bench'
                : 'on_project',

          matchScore,

          matchedSkills,

          missingSkills,

          costRate: Number(user.costRate ?? 0),

          // ====================================
          // CURRENT SPRINT ALLOCATION
          // ====================================

          sprintAllocationId: sprintAllocation?.id ?? null,

          sprintAllocationPercent: allocationPercent,

          activeTaskCount,

          workloadLimit,

          remainingTaskSlots,

          workloadPercent,

          isAtTaskCapacity,

          isTaskOverloaded,

          activeTasks: userOwnedTasks.map((ownedTask) => ({
            id: ownedTask.id,

            title: ownedTask.title ?? 'Task chưa đặt tên',

            status: ownedTask.status,

            progress: Number(ownedTask.progress ?? 0),

            priority: ownedTask.priority,
          })),

          isAssignedToSprint: true,
        };
      })
      .sort((left, right) => {
        // Ưu tiên skill match cao nhất
        if (right.matchScore !== left.matchScore) {
          return right.matchScore - left.matchScore;
        }
        // Nếu skill bằng nhau,
        // ưu tiên người còn workload slot.

        if (left.isAtTaskCapacity !== right.isAtTaskCapacity) {
          return left.isAtTaskCapacity ? 1 : -1;
        }

        // Sau đó ưu tiên người
        // đang có ít Task hơn.

        if (left.activeTaskCount !== right.activeTaskCount) {
          return left.activeTaskCount - right.activeTaskCount;
        }

        // Nếu match bằng nhau,
        // ưu tiên người có allocation cao hơn
        return right.sprintAllocationPercent - left.sprintAllocationPercent;
      });
  }
  async updateTaskAssignee(taskId: string, userId: string | null) {
    const task = await this.taskRepo.findOne({
      where: {
        id: taskId,

        isDeleted: false,
      },
    });

    if (!task) {
      throw new NotFoundException({
        code: 'TASK_NOT_FOUND',

        message: 'Không tìm thấy Task.',
      });
    }

    // Sprint completed/cancelled
    // thì không được đổi owner.
    await this.assertSprintMutable(task.sprintId);

    // ========================================
    // DONE TASK
    // ========================================

    if (task.status === TaskStatus.DONE) {
      throw new ConflictException({
        code: 'DONE_TASK_ASSIGNEE_LOCKED',

        message: 'Task đã DONE nên không thể thay đổi owner.',
      });
    }

    // ========================================
    // UNASSIGN
    // ========================================

    if (!userId) {
      task.userId = null;

      return await this.taskRepo.save(task);
    }

    // ========================================
    // VALIDATE SPRINT MEMBERSHIP
    // ========================================

    await this.assertUserAssignedToSprint(task.sprintId, userId);

    // ========================================
    // ASSIGN
    // ========================================

    task.userId = userId;

    return await this.taskRepo.save(task);
  }

  async updateTaskTimeline(taskId: string, data: UpdateTaskTimelineDto) {
    // ==========================================
    // TASK
    // ==========================================

    const task = await this.taskRepo.findOne({
      where: {
        id: taskId,

        isDeleted: false,
      },
    });

    if (!task) {
      throw new NotFoundException({
        code: 'TASK_NOT_FOUND',

        message: 'Không tìm thấy Task.',
      });
    }

    // ==========================================
    // EMPTY PAYLOAD
    // ==========================================

    if (data.startDate === undefined && data.endDate === undefined) {
      throw new BadRequestException({
        code: 'EMPTY_TASK_TIMELINE_UPDATE',

        message: 'Phải truyền startDate hoặc endDate.',
      });
    }

    // ==========================================
    // SPRINT MUTABLE
    // ==========================================

    const sprint = await this.assertSprintMutable(task.sprintId);

    // ==========================================
    // DONE TASK LOCK
    // ==========================================

    if (task.status === TaskStatus.DONE) {
      throw new ConflictException({
        code: 'DONE_TASK_TIMELINE_LOCKED',

        message: 'Task đã DONE nên không thể chỉnh sửa timeline.',
      });
    }

    // ==========================================
    // BUILD NEW TIMELINE
    // ==========================================

    const newStartDate = data.startDate ?? task.startDate;

    const newEndDate = data.endDate ?? task.endDate;

    // ==========================================
    // TASK MUST STAY INSIDE SPRINT
    // ==========================================

    this.validateTaskTimeline(newStartDate, newEndDate, sprint);

    // ==========================================
    // DEPENDENCY IMPACT
    // ==========================================

    await this.taskDependenciesService.assertTaskTimelineChangeSafe(
      task.id,
      newStartDate,
      newEndDate,
    );

    // ==========================================
    // SAVE
    // ==========================================

    if (data.startDate !== undefined) {
      task.startDate = new Date(data.startDate);
    }

    if (data.endDate !== undefined) {
      task.endDate = new Date(data.endDate);
    }

    return await this.taskRepo.save(task);
  }

  async updateTaskLifecycle(taskId: string, data: UpdateTaskLifecycleDto) {
    const task = await this.taskRepo.findOne({
      where: {
        id: taskId,
        isDeleted: false,
      },
    });

    if (!task) {
      throw new NotFoundException('Không tìm thấy Task');
    }
    await this.assertSprintMutable(task.sprintId);

    // ==========================================
    // STATUS / PROGRESS CONSISTENCY
    // ==========================================

    if (
      data.status === TaskStatus.DONE &&
      data.progress !== undefined &&
      data.progress !== 100
    ) {
      throw new BadRequestException({
        code: 'INVALID_TASK_LIFECYCLE',
        message: 'Task DONE bắt buộc phải có progress = 100%.',
      });
    }

    if (
      data.status === TaskStatus.TODO &&
      data.progress !== undefined &&
      data.progress !== 0
    ) {
      throw new BadRequestException({
        code: 'INVALID_TASK_LIFECYCLE',
        message: 'Task TODO phải có progress = 0%.',
      });
    }

    if (
      (data.status === TaskStatus.IN_PROGRESS ||
        data.status === TaskStatus.BLOCKED) &&
      data.progress === 100
    ) {
      throw new BadRequestException({
        code: 'INVALID_TASK_LIFECYCLE',
        message: 'Task có progress = 100% phải ở trạng thái DONE.',
      });
    }
    // ==========================================
    // DEPENDENCY ENFORCEMENT
    // ==========================================

    // Chỉ những action thể hiện Task bắt đầu/thực thi
    // mới bị dependency khóa.
    //
    // Vẫn cho phép:
    // - đổi priority
    // - reset về TODO
    // - reset progress về 0

    const requestedStatus = data.status?.toString().toUpperCase();

    const requestedProgress =
      data.progress !== undefined ? Number(data.progress) : undefined;

    const triesToStart = requestedStatus === 'IN_PROGRESS';

    const triesToComplete = requestedStatus === 'DONE';

    const triesToProgress =
      requestedProgress !== undefined && requestedProgress > 0;

    if (triesToStart || triesToComplete || triesToProgress) {
      await this.taskDependenciesService.assertDependenciesCompleted(taskId);
    }

    // ==========================================
    // UPDATE PRIORITY
    // ==========================================

    if (data.priority !== undefined) {
      task.priority = data.priority;
    }

    // ==========================================
    // UPDATE STATUS
    // ==========================================

    if (data.status !== undefined) {
      task.status = data.status;

      // DONE luôn = 100%.
      if (data.status === TaskStatus.DONE) {
        task.progress = 100;
      }

      // Reset TODO luôn = 0%.
      if (data.status === TaskStatus.TODO) {
        task.progress = 0;
      }
    }

    // ==========================================
    // UPDATE PROGRESS
    // ==========================================

    if (data.progress !== undefined) {
      task.progress = data.progress;

      // 100% luôn đồng nghĩa DONE.
      if (data.progress === 100) {
        task.status = TaskStatus.DONE;
      }

      // Nếu Task từng DONE nhưng progress
      // bị giảm xuống thì không được giữ DONE.
      if (data.progress < 100 && task.status === TaskStatus.DONE) {
        task.status =
          data.progress === 0 ? TaskStatus.TODO : TaskStatus.IN_PROGRESS;
      }
    }

    return await this.taskRepo.save(task);
  }

  private validateTaskTimeline(
    startDate: string | Date | null | undefined,
    endDate: string | Date | null | undefined,
    sprint: Sprint,
  ) {
    // Task mới bắt buộc phải có timeline.
    if (!startDate || !endDate) {
      throw new BadRequestException({
        code: 'TASK_TIMELINE_REQUIRED',
        message: 'Task phải có ngày bắt đầu và ngày kết thúc.',
      });
    }

    const taskStart = new Date(startDate);

    const taskEnd = new Date(endDate);

    const sprintStart = new Date(sprint.startDate);

    const sprintEnd = new Date(sprint.endDate);

    if (Number.isNaN(taskStart.getTime()) || Number.isNaN(taskEnd.getTime())) {
      throw new BadRequestException({
        code: 'INVALID_TASK_DATE',
        message: 'Ngày bắt đầu hoặc ngày kết thúc Task không hợp lệ.',
      });
    }

    // Cho phép Task làm trong cùng một ngày.
    if (taskStart.getTime() > taskEnd.getTime()) {
      throw new BadRequestException({
        code: 'INVALID_TASK_TIMELINE',
        message: 'Ngày bắt đầu Task không được lớn hơn ngày kết thúc.',
      });
    }

    if (taskStart.getTime() < sprintStart.getTime()) {
      throw new ConflictException({
        code: 'TASK_OUTSIDE_SPRINT_TIMELINE',
        message: 'Task không được bắt đầu trước ngày bắt đầu Sprint.',
        sprintStartDate: sprint.startDate,
        taskStartDate: startDate,
      });
    }

    if (taskEnd.getTime() > sprintEnd.getTime()) {
      throw new ConflictException({
        code: 'TASK_OUTSIDE_SPRINT_TIMELINE',
        message: 'Task không được kết thúc sau ngày kết thúc Sprint.',
        sprintEndDate: sprint.endDate,
        taskEndDate: endDate,
      });
    }
  }
  private async assertUserAssignedToSprint(sprintId: string, userId: string) {
    const user = await this.userRepo.findOne({
      where: {
        id: userId,
        isDeleted: false,
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',

        message: 'Không tìm thấy nhân sự.',
      });
    }

    const allocation = await this.userSprintRepo.findOne({
      where: {
        sprintId,

        userId,

        status: UserSprintStatus.ASSIGNED,
      },
    });

    if (!allocation) {
      throw new ConflictException({
        code: 'USER_NOT_ASSIGNED_TO_SPRINT',

        message:
          'Nhân sự phải ở trạng thái ASSIGNED trong Sprint trước khi được giao Task.',

        sprintId,

        userId,
      });
    }

    return allocation;
  }

  private async assertSprintMutable(sprintId: string) {
    const sprint = await this.sprintRepo.findOne({
      where: {
        id: sprintId,
        isDeleted: false,
      },
    });

    if (!sprint) {
      throw new NotFoundException({
        code: 'SPRINT_NOT_FOUND',
        message: 'Không tìm thấy Sprint của Task.',
      });
    }

    const status = (sprint.status ?? '').toString().toUpperCase();

    if (status === 'COMPLETED' || status === 'CANCELLED') {
      throw new ConflictException({
        code: 'SPRINT_READ_ONLY',
        message: 'Sprint đã hoàn thành hoặc đã hủy. Không thể thay đổi Task.',
        sprintId: sprint.id,
        sprintStatus: sprint.status,
      });
    }

    return sprint;
  }
  private calculateTaskWorkloadLimit(allocationPercent: number) {
    const normalizedAllocation = Math.max(
      1,
      Math.min(100, Number(allocationPercent ?? 0)),
    );

    // MVP heuristic:
    // mỗi 25% allocation tương ứng
    // khoảng 1 concurrent unfinished Task.
    return Math.max(1, Math.ceil(normalizedAllocation / 25));
  }
}
