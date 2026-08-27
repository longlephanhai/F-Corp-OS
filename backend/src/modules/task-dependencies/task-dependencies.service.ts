import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { In, Repository } from 'typeorm';

import { TaskDependency } from './entities/task-dependency.entity';

import { Task } from '../task/entities/task.entity';
import { Sprint } from '../sprints/entities/sprint.entity';
import dayjs from 'dayjs';

@Injectable()
export class TaskDependenciesService {
  constructor(
    @InjectRepository(TaskDependency)
    private readonly dependencyRepo: Repository<TaskDependency>,

    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Sprint)
    private readonly sprintRepo: Repository<Sprint>,
  ) {}

  // ==========================================
  // GET DEPENDENCIES
  // ==========================================

  async getDependencies(taskId: string) {
    const task = await this.taskRepo.findOne({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new NotFoundException('Không tìm thấy Task.');
    }

    const dependencies = await this.dependencyRepo.find({
      where: {
        taskId,
      },

      order: {
        createdAt: 'ASC',
      },
    });

    if (dependencies.length === 0) {
      return [];
    }

    const dependencyTaskIds = dependencies.map(
      (dependency) => dependency.dependsOnTaskId,
    );

    const dependencyTasks = await this.taskRepo
      .createQueryBuilder('task')
      .where('task.id IN (:...ids)', {
        ids: dependencyTaskIds,
      })
      .getMany();

    const taskMap = new Map(
      dependencyTasks.map((dependencyTask) => [
        dependencyTask.id,
        dependencyTask,
      ]),
    );

    return dependencies.map((dependency) => {
      const dependencyTask = taskMap.get(dependency.dependsOnTaskId);

      return {
        id: dependency.id,

        taskId: dependency.taskId,

        dependsOnTaskId: dependency.dependsOnTaskId,

        createdAt: dependency.createdAt,

        dependsOnTask: dependencyTask
          ? {
              id: dependencyTask.id,

              title: dependencyTask.title,

              status: dependencyTask.status,

              progress: dependencyTask.progress,

              priority: dependencyTask.priority,

              endDate: dependencyTask.endDate,
            }
          : null,
      };
    });
  }

  // ==========================================
  // CREATE DEPENDENCY
  // ==========================================

  async createDependency(taskId: string, dependsOnTaskId: string) {
    // Không được phụ thuộc chính mình.
    if (taskId === dependsOnTaskId) {
      throw new BadRequestException({
        code: 'SELF_DEPENDENCY',

        message: 'Task không thể phụ thuộc chính nó.',
      });
    }

    const [task, dependsOnTask] = await Promise.all([
      this.taskRepo.findOne({
        where: {
          id: taskId,
        },
      }),

      this.taskRepo.findOne({
        where: {
          id: dependsOnTaskId,
        },
      }),
    ]);

    if (!task) {
      throw new NotFoundException('Không tìm thấy Task cần cấu hình.');
    }

    if (!dependsOnTask) {
      throw new NotFoundException('Không tìm thấy Task dependency.');
    }
    // Không cho dependency xuyên Sprint.
    if (task.sprintId !== dependsOnTask.sprintId) {
      throw new ConflictException({
        code: 'CROSS_SPRINT_DEPENDENCY',

        message:
          'Hai Task phải thuộc cùng một Sprint mới có thể tạo dependency.',

        task: {
          id: task.id,
          sprintId: task.sprintId,
        },

        dependsOnTask: {
          id: dependsOnTask.id,
          sprintId: dependsOnTask.sprintId,
        },
      });
    }
    // ==========================================
    // DEPENDENCY TIMELINE
    // ==========================================

    this.assertDependencyTimelineValid(task, dependsOnTask);

    // Sprint terminal => Dependency read-only.
    await this.assertSprintMutable(task.sprintId);
    const taskStatus = (task.status ?? 'TODO').toString().toUpperCase();

    const taskProgress = Number(task.progress ?? 0);

    const prerequisiteStatus = (dependsOnTask.status ?? 'TODO')
      .toString()
      .toUpperCase();

    // Nếu prerequisite chưa DONE,
    // task phụ thuộc chưa được phép
    // đã bắt đầu trước đó.
    if (
      prerequisiteStatus !== 'DONE' &&
      (taskStatus !== 'TODO' || taskProgress > 0)
    ) {
      throw new ConflictException({
        code: 'TASK_ALREADY_STARTED',

        message:
          'Không thể thêm dependency chưa hoàn thành vào Task đã bắt đầu.',

        task: {
          id: task.id,

          title: task.title,

          status: task.status,

          progress: task.progress,
        },

        dependency: {
          id: dependsOnTask.id,

          title: dependsOnTask.title,

          status: dependsOnTask.status,

          progress: dependsOnTask.progress,
        },
      });
    }

    // ========================================
    // DUPLICATE
    // ========================================

    const existing = await this.dependencyRepo.findOne({
      where: {
        taskId,
        dependsOnTaskId,
      },
    });

    if (existing) {
      throw new ConflictException({
        code: 'DUPLICATE_DEPENDENCY',

        message: 'Dependency này đã tồn tại.',
      });
    }

    // ========================================
    // CYCLE DETECTION
    // ========================================

    const createsCycle = await this.wouldCreateCycle(taskId, dependsOnTaskId);

    if (createsCycle) {
      throw new ConflictException({
        code: 'DEPENDENCY_CYCLE',

        message: 'Không thể tạo dependency vì sẽ tạo vòng lặp giữa các Task.',
      });
    }

    const dependency = this.dependencyRepo.create({
      taskId,

      dependsOnTaskId,
    });

    return await this.dependencyRepo.save(dependency);
  }

  // ==========================================
  // REMOVE
  // ==========================================

  async removeDependency(taskId: string, dependencyId: string) {
    const dependency = await this.dependencyRepo.findOne({
      where: {
        id: dependencyId,
        taskId,
      },
    });
    const task = await this.taskRepo.findOne({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new NotFoundException('Không tìm thấy Task của dependency.');
    }

    await this.assertSprintMutable(task.sprintId);

    if (!dependency) {
      throw new NotFoundException('Không tìm thấy dependency.');
    }

    await this.dependencyRepo.remove(dependency);

    return {
      success: true,

      id: dependencyId,
    };
  }

  // ==========================================
  // CHECK BLOCKING STATUS
  // ==========================================

  async getDependencyStatus(taskId: string) {
    const dependencies = await this.getDependencies(taskId);

    const unfinished = dependencies.filter((dependency) => {
      const status = (dependency.dependsOnTask?.status ?? '')
        .toString()
        .toUpperCase();

      return status !== 'DONE';
    });

    return {
      taskId,

      totalDependencies: dependencies.length,

      unfinishedDependencies: unfinished.length,

      isBlockedByDependency: unfinished.length > 0,

      dependencies,
    };
  }

  async assertTaskTimelineChangeSafe(
    taskId: string,
    newStartDate: string | Date,
    newEndDate: string | Date,
  ) {
    // ==========================================
    // ALL RELATIONS INVOLVING THIS TASK
    // ==========================================

    const relations = await this.dependencyRepo
      .createQueryBuilder('dependency')
      .where('dependency.taskId = :taskId', {
        taskId,
      })
      .orWhere('dependency.dependsOnTaskId = :taskId', {
        taskId,
      })
      .getMany();

    if (relations.length === 0) {
      return true;
    }

    // ==========================================
    // LOAD RELATED TASKS
    // ==========================================

    const relatedTaskIds = [
      ...new Set(
        relations.flatMap((dependency) => [
          dependency.taskId,
          dependency.dependsOnTaskId,
        ]),
      ),
    ].filter((id) => id !== taskId);

    const relatedTasks =
      relatedTaskIds.length > 0
        ? await this.taskRepo.find({
            where: {
              id: In(relatedTaskIds),

              isDeleted: false,
            },
          })
        : [];

    const taskMap = new Map(relatedTasks.map((task) => [task.id, task]));

    const newStart = dayjs(newStartDate);

    const newEnd = dayjs(newEndDate);

    const conflicts: any[] = [];

    // ==========================================
    // CHECK EVERY DEPENDENCY
    // ==========================================

    for (const dependency of relations) {
      // ========================================
      // CASE A
      //
      // CURRENT TASK DEPENDS ON ANOTHER TASK
      //
      // taskId = CURRENT
      // dependsOnTaskId = PREREQUISITE
      //
      // prerequisite.end <= current.start
      // ========================================

      if (dependency.taskId === taskId) {
        const prerequisite = taskMap.get(dependency.dependsOnTaskId);

        if (!prerequisite) {
          continue;
        }

        if (!prerequisite.endDate) {
          conflicts.push({
            type: 'PREREQUISITE_TIMELINE_MISSING',

            dependencyId: dependency.id,

            taskId: prerequisite.id,

            taskTitle: prerequisite.title,
          });

          continue;
        }

        const prerequisiteEnd = dayjs(prerequisite.endDate);

        if (prerequisiteEnd.isAfter(newStart, 'day')) {
          conflicts.push({
            type: 'PREREQUISITE_ENDS_TOO_LATE',

            dependencyId: dependency.id,

            prerequisite: {
              id: prerequisite.id,

              title: prerequisite.title,

              endDate: prerequisite.endDate,
            },

            currentTask: {
              id: taskId,

              newStartDate,
            },
          });
        }
      }

      // ========================================
      // CASE B
      //
      // ANOTHER TASK DEPENDS ON CURRENT TASK
      //
      // current.end <= dependent.start
      // ========================================

      if (dependency.dependsOnTaskId === taskId) {
        const dependentTask = taskMap.get(dependency.taskId);

        if (!dependentTask) {
          continue;
        }

        if (!dependentTask.startDate) {
          conflicts.push({
            type: 'DEPENDENT_TIMELINE_MISSING',

            dependencyId: dependency.id,

            taskId: dependentTask.id,

            taskTitle: dependentTask.title,
          });

          continue;
        }

        const dependentStart = dayjs(dependentTask.startDate);

        if (newEnd.isAfter(dependentStart, 'day')) {
          conflicts.push({
            type: 'CURRENT_TASK_ENDS_TOO_LATE',

            dependencyId: dependency.id,

            currentTask: {
              id: taskId,

              newEndDate,
            },

            dependentTask: {
              id: dependentTask.id,

              title: dependentTask.title,

              startDate: dependentTask.startDate,
            },
          });
        }
      }
    }

    if (conflicts.length > 0) {
      throw new ConflictException({
        code: 'TASK_TIMELINE_DEPENDENCY_CONFLICT',

        message: `Timeline mới xung đột với ${conflicts.length} dependency hiện có.`,

        taskId,

        requestedTimeline: {
          startDate: newStartDate,

          endDate: newEndDate,
        },

        conflicts,
      });
    }

    return true;
  }

  // ==========================================
  // CYCLE DETECTION
  //
  // Nếu:
  // A depends B
  // B depends C
  //
  // thì không cho:
  // C depends A
  // ==========================================
  async assertDependenciesCompleted(taskId: string) {
    const status = await this.getDependencyStatus(taskId);

    if (status.unfinishedDependencies > 0) {
      throw new ConflictException({
        code: 'UNFINISHED_DEPENDENCIES',

        message: `Task đang phụ thuộc ${status.unfinishedDependencies} task chưa hoàn thành.`,

        taskId,

        unfinishedDependencies: status.dependencies
          .filter(
            (dependency) =>
              (dependency.dependsOnTask?.status ?? '').toUpperCase() !== 'DONE',
          )
          .map((dependency) => ({
            id: dependency.dependsOnTask?.id ?? dependency.dependsOnTaskId,

            title: dependency.dependsOnTask?.title ?? 'Task',

            status: dependency.dependsOnTask?.status ?? 'UNKNOWN',

            progress: dependency.dependsOnTask?.progress ?? 0,
          })),
      });
    }

    return true;
  }
  private assertDependencyTimelineValid(task: Task, dependsOnTask: Task) {
    // ==========================================
    // REQUIRE TIMELINE
    // ==========================================

    if (
      !task.startDate ||
      !task.endDate ||
      !dependsOnTask.startDate ||
      !dependsOnTask.endDate
    ) {
      throw new ConflictException({
        code: 'DEPENDENCY_TIMELINE_REQUIRED',

        message:
          'Cả Task và prerequisite phải có timeline hợp lệ trước khi tạo dependency.',

        task: {
          id: task.id,
          title: task.title,
          startDate: task.startDate,
          endDate: task.endDate,
        },

        dependency: {
          id: dependsOnTask.id,
          title: dependsOnTask.title,
          startDate: dependsOnTask.startDate,
          endDate: dependsOnTask.endDate,
        },
      });
    }

    const taskStart = dayjs(task.startDate);

    const taskEnd = dayjs(task.endDate);

    const dependencyStart = dayjs(dependsOnTask.startDate);

    const dependencyEnd = dayjs(dependsOnTask.endDate);

    // ==========================================
    // INVALID LEGACY DATE
    // ==========================================

    if (
      !taskStart.isValid() ||
      !taskEnd.isValid() ||
      !dependencyStart.isValid() ||
      !dependencyEnd.isValid()
    ) {
      throw new ConflictException({
        code: 'INVALID_DEPENDENCY_TIMELINE',

        message: 'Timeline của Task hoặc prerequisite không hợp lệ.',
      });
    }

    // ==========================================
    // FINISH-TO-START
    //
    // prerequisite phải kết thúc
    // trước hoặc đúng ngày Task bắt đầu.
    // ==========================================

    if (dependencyEnd.isAfter(taskStart, 'day')) {
      throw new ConflictException({
        code: 'DEPENDENCY_TIMELINE_CONFLICT',

        message:
          'Prerequisite phải kết thúc trước hoặc đúng ngày Task phụ thuộc bắt đầu.',

        task: {
          id: task.id,

          title: task.title ?? 'Task chưa đặt tên',

          startDate: task.startDate,

          endDate: task.endDate,
        },

        dependency: {
          id: dependsOnTask.id,

          title: dependsOnTask.title ?? 'Task prerequisite',

          startDate: dependsOnTask.startDate,

          endDate: dependsOnTask.endDate,
        },
      });
    }

    return true;
  }

  private async wouldCreateCycle(taskId: string, dependsOnTaskId: string) {
    const dependencies = await this.dependencyRepo.find();

    const graph = new Map<string, string[]>();

    dependencies.forEach((dependency) => {
      const current = graph.get(dependency.taskId) ?? [];

      current.push(dependency.dependsOnTaskId);

      graph.set(dependency.taskId, current);
    });

    // giả lập dependency mới
    const proposed = graph.get(taskId) ?? [];

    proposed.push(dependsOnTaskId);

    graph.set(taskId, proposed);

    const visited = new Set<string>();

    const stack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      if (stack.has(node)) {
        return true;
      }

      if (visited.has(node)) {
        return false;
      }

      visited.add(node);
      stack.add(node);

      const children = graph.get(node) ?? [];

      for (const child of children) {
        if (hasCycle(child)) {
          return true;
        }
      }

      stack.delete(node);

      return false;
    };

    for (const node of graph.keys()) {
      if (hasCycle(node)) {
        return true;
      }
    }

    return false;
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
        message:
          'Sprint đã hoàn thành hoặc đã hủy. Không thể thay đổi Task Dependency.',
        sprintId: sprint.id,
        sprintStatus: sprint.status,
      });
    }

    return sprint;
  }
}
