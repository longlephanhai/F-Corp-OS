import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { TaskDependency } from './entities/task-dependency.entity';

import { Task } from '../task/entities/task.entity';

@Injectable()
export class TaskDependenciesService {
  constructor(
    @InjectRepository(TaskDependency)
    private readonly dependencyRepo: Repository<TaskDependency>,

    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
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
}
