import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Project } from '../projects/entities/project.entity';

import { ProjectManager } from '../projects/entities/project-manager.entity';

import { Sprint } from '../sprints/entities/sprint.entity';

import { Task } from '../task/entities/task.entity';

import { UserSprint } from '../user-sprints/entities/user-sprint.entity';

@Injectable()
export class PmAccessService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    @InjectRepository(ProjectManager)
    private readonly projectManagerRepo: Repository<ProjectManager>,

    @InjectRepository(Sprint)
    private readonly sprintRepo: Repository<Sprint>,

    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    @InjectRepository(UserSprint)
    private readonly userSprintRepo: Repository<UserSprint>,
  ) {}

  // ==========================================
  // PROJECT ACCESS
  //
  // PRIMARY PM hoặc CO-PM đều được access.
  // ==========================================

  async assertProjectAccess(userId: string, projectId: string) {
    const project = await this.projectRepo.findOne({
      where: {
        id: projectId,

        isDeleted: false,
      },
    });

    if (!project) {
      throw new NotFoundException({
        code: 'PROJECT_NOT_FOUND',

        message: 'Không tìm thấy Project.',
      });
    }

    // ========================================
    // PRIMARY PM
    // ========================================

    if (project.pmId === userId) {
      return project;
    }

    // ========================================
    // CO-PM / MANAGER RELATION
    // ========================================

    const relation = await this.projectManagerRepo.findOne({
      where: {
        projectId,

        userId,
      },
    });

    if (!relation) {
      throw new ForbiddenException({
        code: 'PM_PROJECT_ACCESS_DENIED',

        message: 'Bạn không phải Project Manager của Project này.',

        projectId,
      });
    }

    return project;
  }

  // ==========================================
  // PRIMARY PM ONLY
  // ==========================================

  async assertPrimaryProjectManager(userId: string, projectId: string) {
    const project = await this.projectRepo.findOne({
      where: {
        id: projectId,

        isDeleted: false,
      },
    });

    if (!project) {
      throw new NotFoundException({
        code: 'PROJECT_NOT_FOUND',

        message: 'Không tìm thấy Project.',
      });
    }

    if (project.pmId !== userId) {
      throw new ForbiddenException({
        code: 'PRIMARY_PM_REQUIRED',

        message: 'Chỉ Primary PM mới được thực hiện thao tác này.',

        projectId,
      });
    }

    return project;
  }

  // ==========================================
  // SPRINT ACCESS
  // ==========================================

  async assertSprintAccess(userId: string, sprintId: string) {
    const sprint = await this.sprintRepo.findOne({
      where: {
        id: sprintId,

        isDeleted: false,
      },
    });

    if (!sprint) {
      throw new NotFoundException({
        code: 'SPRINT_NOT_FOUND',

        message: 'Không tìm thấy Sprint.',
      });
    }

    await this.assertProjectAccess(userId, sprint.projectId);

    return sprint;
  }

  // ==========================================
  // TASK ACCESS
  // ==========================================

  async assertTaskAccess(userId: string, taskId: string) {
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

    const sprint = await this.assertSprintAccess(userId, task.sprintId);

    return {
      task,
      sprint,
    };
  }

  // ==========================================
  // ALLOCATION ACCESS
  // ==========================================

  async assertAllocationAccess(userId: string, allocationId: string) {
    const allocation = await this.userSprintRepo.findOne({
      where: {
        id: allocationId,
      },
    });

    if (!allocation) {
      throw new NotFoundException({
        code: 'ALLOCATION_NOT_FOUND',

        message: 'Không tìm thấy Allocation.',
      });
    }

    const sprint = await this.assertSprintAccess(userId, allocation.sprintId);

    return {
      allocation,
      sprint,
    };
  }
}
