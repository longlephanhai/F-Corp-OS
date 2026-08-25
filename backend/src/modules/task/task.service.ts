import {
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

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    @InjectRepository(Sprint)
    private readonly sprintRepo: Repository<Sprint>,
    @InjectRepository(User)
    private userRepo: Repository<User>,

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
      throw new NotFoundException({
        code: 'SPRINT_REQUIRED',
        message: 'Task phải thuộc một Sprint.',
      });
    }

    await this.assertSprintMutable(data.sprintId);
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

  async getMatchingCandidates(taskId: string) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, isDeleted: false },
    });
    if (!task) {
      throw new NotFoundException('Không tìm thấy task');
    }

    const users = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect(
        'user.userSkills',
        'userSkill',
        'userSkill.isDeleted = :isDeleted',
        { isDeleted: false },
      )
      .leftJoinAndSelect('userSkill.skill', 'skill')
      .where('user.isDeleted = :isDeleted', { isDeleted: false })
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

    const requirements = (task.requiredSkills ?? []).map(
      (requirement: any) => ({
        identifier: requirement.skill_id ?? requirement.skill,
        label: requirement.skill ?? requirement.skill_id ?? 'Chưa xác định',
        minLevel: requirement.min_level ?? requirement.level ?? 1,
      }),
    );

    return users
      .map((user) => {
        const matchedSkills = requirements
          .filter((requirement) =>
            user.userSkills.some(
              (userSkill) =>
                (userSkill.skillId === requirement.identifier ||
                  userSkill.skill?.name === requirement.identifier) &&
                userSkill.level >= requirement.minLevel,
            ),
          )
          .map((requirement) => requirement.label);
        const missingSkills = requirements
          .filter((requirement) => !matchedSkills.includes(requirement.label))
          .map((requirement) => requirement.label);
        const matchScore = requirements.length
          ? Math.round((matchedSkills.length / requirements.length) * 100)
          : 0;

        return {
          id: user.id,
          fullName: user.fullName,
          title: user.title ?? 'Chưa cập nhật vị trí',
          status: user.status === 'AVAILABLE' ? 'available' : 'on_project',
          matchScore,
          matchedSkills,
          missingSkills,
          costRate: Number(user.costRate ?? 0),
        };
      })
      .sort((left, right) => right.matchScore - left.matchScore);
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

      if (data.status === TaskStatus.DONE) {
        task.progress = 100;
      }
    }

    // ==========================================
    // UPDATE PROGRESS
    // ==========================================

    if (data.progress !== undefined) {
      task.progress = data.progress;

      if (data.progress === 100) {
        task.status = TaskStatus.DONE;
      }

      if (data.progress < 100 && task.status === TaskStatus.DONE) {
        task.status = TaskStatus.IN_PROGRESS;
      }
    }

    return await this.taskRepo.save(task);
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
}
