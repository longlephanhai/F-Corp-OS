import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { In, Repository } from 'typeorm';

import dayjs from 'dayjs';

import { Project } from '../projects/entities/project.entity';

import { Sprint } from '../sprints/entities/sprint.entity';

import { Task, TaskPriority, TaskStatus } from '../task/entities/task.entity';

import { UserSprint } from '../user-sprints/entities/user-sprint.entity';

import { SprintsService } from '../sprints/sprints.service';

import {
  PmActionCenterItem,
  PmActionCenterResult,
  PmActionSeverity,
} from './pm-action-center.types';

@Injectable()
export class PmActionCenterService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    @InjectRepository(Sprint)
    private readonly sprintRepo: Repository<Sprint>,

    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    @InjectRepository(UserSprint)
    private readonly userSprintRepo: Repository<UserSprint>,

    private readonly sprintsService: SprintsService,
  ) {}

  // ==========================================
  // PM ACTION CENTER
  // ==========================================

  async getActionCenter(pmId: string): Promise<PmActionCenterResult> {
    const projects = await this.getManagedProjects(pmId);

    if (projects.length === 0) {
      return this.buildResult([], 0, 0, 0);
    }

    const projectIds = projects.map((project) => project.id);

    const projectMap = new Map(
      projects.map((project) => [project.id, project]),
    );

    // ========================================
    // CURRENT SPRINT SCOPE
    //
    // Action Center không cần hiển thị
    // lịch sử Sprint completed/cancelled.
    // ========================================

    const sprints = await this.sprintRepo.find({
      where: {
        projectId: In(projectIds),

        isDeleted: false,

        status: In(['active', 'upcoming']),
      },

      order: {
        startDate: 'ASC',
      },
    });

    if (sprints.length === 0) {
      return this.buildResult([], projects.length, 0, 0);
    }

    const sprintIds = sprints.map((sprint) => sprint.id);

    const sprintMap = new Map(sprints.map((sprint) => [sprint.id, sprint]));

    const [tasks, allocations] = await Promise.all([
      this.taskRepo.find({
        where: {
          sprintId: In(sprintIds),

          isDeleted: false,
        },
      }),

      this.userSprintRepo.find({
        where: {
          sprintId: In(sprintIds),
        },

        relations: {
          user: true,
        },
      }),
    ]);

    const items: PmActionCenterItem[] = [];

    // ========================================
    // TASK ACTIONS
    // ========================================

    const today = dayjs().startOf('day');

    for (const task of tasks) {
      const sprint = sprintMap.get(task.sprintId);

      if (!sprint) {
        continue;
      }

      const project = projectMap.get(sprint.projectId);

      if (!project) {
        continue;
      }

      const taskStatus = (task.status ?? '').toString().toUpperCase();

      if (taskStatus === TaskStatus.DONE) {
        continue;
      }

      // ======================================
      // 1. OVERDUE
      //
      // Mỗi Task chỉ sinh một action chính.
      // Overdue có priority cao nhất.
      // ======================================

      const overdue =
        Boolean(task.endDate) &&
        dayjs(task.endDate).startOf('day').isBefore(today);

      if (overdue) {
        items.push({
          id: `task-overdue-${task.id}`,

          type: 'OVERDUE_TASK',

          category: 'CRITICAL',

          severity: 'CRITICAL',

          title: task.title ?? 'Task chưa đặt tên',

          description: `Task đã quá hạn nhưng chưa hoàn thành. Tiến độ hiện tại ${Number(
            task.progress ?? 0,
          )}%.`,

          projectId: project.id,

          projectName: project.name,

          sprintId: sprint.id,

          sprintName: sprint.name,

          taskId: task.id,

          dueDate: task.endDate,

          actionLabel: 'Mở Sprint',
        });

        continue;
      }

      // ======================================
      // 2. BLOCKED
      // ======================================

      if (taskStatus === TaskStatus.BLOCKED) {
        items.push({
          id: `task-blocked-${task.id}`,

          type: 'BLOCKED_TASK',

          category: 'CRITICAL',

          severity: 'HIGH',

          title: task.title ?? 'Task chưa đặt tên',

          description:
            'Task đang BLOCKED và cần PM kiểm tra nguyên nhân hoặc dependency.',

          projectId: project.id,

          projectName: project.name,

          sprintId: sprint.id,

          sprintName: sprint.name,

          taskId: task.id,

          dueDate: task.endDate,

          actionLabel: 'Mở Sprint',
        });

        continue;
      }

      // ======================================
      // 3. CRITICAL PRIORITY
      // ======================================

      if (task.priority === TaskPriority.CRITICAL) {
        items.push({
          id: `task-critical-${task.id}`,

          type: 'CRITICAL_TASK',

          category: 'CRITICAL',

          severity: 'HIGH',

          title: task.title ?? 'Task chưa đặt tên',

          description: `Task CRITICAL chưa hoàn thành. Tiến độ ${Number(
            task.progress ?? 0,
          )}%.`,

          projectId: project.id,

          projectName: project.name,

          sprintId: sprint.id,

          sprintName: sprint.name,

          taskId: task.id,

          dueDate: task.endDate,

          actionLabel: 'Mở Sprint',
        });

        continue;
      }

      // ======================================
      // 4. NO OWNER
      // ======================================

      if (!task.userId) {
        items.push({
          id: `task-unassigned-${task.id}`,

          type: 'UNASSIGNED_TASK',

          category: 'RESOURCE',

          severity: 'MEDIUM',

          title: task.title ?? 'Task chưa đặt tên',

          description: 'Task chưa có owner. PM cần chọn nhân sự phù hợp.',

          projectId: project.id,

          projectName: project.name,

          sprintId: sprint.id,

          sprintName: sprint.name,

          taskId: task.id,

          dueDate: task.endDate,

          actionLabel: 'Phân bổ Task',
        });
      }
    }

    // ========================================
    // ALLOCATION ACTIONS
    // ========================================

    for (const allocation of allocations) {
      const sprint = sprintMap.get(allocation.sprintId);

      if (!sprint) {
        continue;
      }

      const project = projectMap.get(sprint.projectId);

      if (!project) {
        continue;
      }

      const status = (allocation.status ?? '').toString().toLowerCase();

      const employeeName =
        allocation.user?.fullName ?? allocation.user?.email ?? 'Nhân sự';

      const percentage = Number(allocation.percitant ?? 0);

      // REQUESTED:
      // PM đã tạo nhưng chưa gửi invitation.
      if (status === 'requested') {
        items.push({
          id: `allocation-requested-${allocation.id}`,

          type: 'ALLOCATION_NOT_SENT',

          category: 'APPROVAL',

          severity: 'MEDIUM',

          title: 'Yêu cầu phân bổ chưa gửi lời mời',

          description: `${employeeName} • ${percentage}% công suất.`,

          projectId: project.id,

          projectName: project.name,

          sprintId: sprint.id,

          sprintName: sprint.name,

          allocationId: allocation.id,

          userId: allocation.userId,

          actionLabel: 'Mở phân bổ',
        });

        continue;
      }

      // PENDING:
      // Invitation đã gửi, chờ Dev.
      if (status === 'pending_approval') {
        items.push({
          id: `allocation-pending-${allocation.id}`,

          type: 'ALLOCATION_PENDING',

          category: 'APPROVAL',

          severity: 'MEDIUM',

          title: 'Đang chờ Dev phản hồi',

          description: `${employeeName} đang có lời mời ${percentage}% cho Sprint này.`,

          projectId: project.id,

          projectName: project.name,

          sprintId: sprint.id,

          sprintName: sprint.name,

          allocationId: allocation.id,

          userId: allocation.userId,

          actionLabel: 'Mở Sprint',
        });

        continue;
      }

      // Không dùng enum DECLINED ở đây để
      // service vẫn ít coupling hơn với
      // migration invitation.
      if (status === 'declined') {
        const responseReason = (
          allocation as UserSprint & {
            responseReason?: string | null;
          }
        ).responseReason;

        items.push({
          id: `allocation-declined-${allocation.id}`,

          type: 'ALLOCATION_DECLINED',

          category: 'RESOURCE',

          severity: 'HIGH',

          title: 'Dev đã từ chối lời mời Sprint',

          description: responseReason
            ? `${employeeName}: ${responseReason}`
            : `${employeeName} đã từ chối lời mời ${percentage}%.`,

          projectId: project.id,

          projectName: project.name,

          sprintId: sprint.id,

          sprintName: sprint.name,

          allocationId: allocation.id,

          userId: allocation.userId,

          actionLabel: 'Xử lý phân bổ',
        });
      }
    }

    // ========================================
    // UPCOMING SPRINT READINESS
    //
    // Chỉ cảnh báo Sprint bắt đầu trong
    // 7 ngày tới để Action Center không spam.
    // ========================================

    const upcomingSprints = sprints.filter(
      (sprint) => (sprint.status ?? '').toString().toLowerCase() === 'upcoming',
    );

    await Promise.all(
      upcomingSprints.map(async (sprint) => {
        if (!sprint.startDate) {
          return;
        }

        const daysUntilStart = dayjs(sprint.startDate)
          .startOf('day')
          .diff(today, 'day');

        if (daysUntilStart < 0 || daysUntilStart > 7) {
          return;
        }

        try {
          const readiness = await this.sprintsService.getStartReadiness(
            sprint.id,
          );

          const summary = readiness.summary;

          // Không dùng canStart trực tiếp vì
          // future Sprint luôn có blocker
          // "chưa đến ngày bắt đầu".
          const hasReadinessIssue =
            summary.totalTasks === 0 ||
            summary.assignedResources === 0 ||
            summary.unassignedTasks > 0 ||
            summary.pendingAllocations > 0 ||
            summary.dependencyBlockedTasks > 0;

          if (!hasReadinessIssue) {
            return;
          }

          const project = projectMap.get(sprint.projectId);

          if (!project) {
            return;
          }

          const problems: string[] = [];

          if (summary.totalTasks === 0) {
            problems.push('chưa có Task');
          }

          if (summary.assignedResources === 0) {
            problems.push('chưa có nhân sự ASSIGNED');
          }

          if (summary.unassignedTasks > 0) {
            problems.push(`${summary.unassignedTasks} Task chưa có owner`);
          }

          if (summary.pendingAllocations > 0) {
            problems.push(`${summary.pendingAllocations} allocation đang chờ`);
          }

          if (summary.dependencyBlockedTasks > 0) {
            problems.push(
              `${summary.dependencyBlockedTasks} Task vướng dependency`,
            );
          }

          const severity: PmActionSeverity =
            summary.totalTasks === 0 || summary.assignedResources === 0
              ? 'HIGH'
              : 'MEDIUM';

          items.push({
            id: `sprint-readiness-${sprint.id}`,

            type: 'SPRINT_NOT_READY',

            category: 'MONITORING',

            severity,

            title: `${sprint.name ?? 'Sprint'} sắp bắt đầu nhưng chưa sẵn sàng`,

            description: problems.join(' • '),

            projectId: project.id,

            projectName: project.name,

            sprintId: sprint.id,

            sprintName: sprint.name,

            dueDate: sprint.startDate,

            actionLabel: 'Kiểm tra Sprint',
          });
        } catch (error) {
          // Action Center không được fail toàn bộ
          // chỉ vì readiness của 1 Sprint lỗi.
          console.error(
            `[PM Action Center] Không kiểm tra được readiness Sprint ${sprint.id}:`,
            error,
          );
        }
      }),
    );

    // ========================================
    // SORT
    // ========================================

    const severityOrder: Record<PmActionSeverity, number> = {
      CRITICAL: 4,

      HIGH: 3,

      MEDIUM: 2,

      LOW: 1,
    };

    items.sort((left, right) => {
      const severityDiff =
        severityOrder[right.severity] - severityOrder[left.severity];

      if (severityDiff !== 0) {
        return severityDiff;
      }

      const leftDate = left.dueDate
        ? new Date(left.dueDate).getTime()
        : Number.MAX_SAFE_INTEGER;

      const rightDate = right.dueDate
        ? new Date(right.dueDate).getTime()
        : Number.MAX_SAFE_INTEGER;

      return leftDate - rightDate;
    });

    const activeSprintCount = sprints.filter(
      (sprint) => (sprint.status ?? '').toString().toLowerCase() === 'active',
    ).length;

    return this.buildResult(
      items,
      projects.length,
      activeSprintCount,
      upcomingSprints.length,
    );
  }

  // ==========================================
  // PM PROJECT SCOPE
  //
  // Primary PM + Co-PM.
  // ==========================================

  private async getManagedProjects(pmId: string) {
    return this.projectRepo
      .createQueryBuilder('project')

      .where('project.isDeleted = :isDeleted', {
        isDeleted: false,
      })

      .andWhere(
        `
        (
          project.pmId = :pmId
          OR EXISTS (
            SELECT 1
            FROM project_managers actionManager
            WHERE actionManager.project_id = project.id
              AND actionManager.user_id = :pmId
          )
        )
        `,
        {
          pmId,
        },
      )

      .distinct(true)

      .getMany();
  }

  // ==========================================
  // RESULT
  // ==========================================

  private buildResult(
    items: PmActionCenterItem[],

    managedProjects: number,

    activeSprints: number,

    upcomingSprints: number,
  ): PmActionCenterResult {
    return {
      generatedAt: new Date().toISOString(),

      summary: {
        totalActions: items.length,

        critical: items.filter((item) => item.category === 'CRITICAL').length,

        approvals: items.filter((item) => item.category === 'APPROVAL').length,

        resourceIssues: items.filter((item) => item.category === 'RESOURCE')
          .length,

        monitoring: items.filter((item) => item.category === 'MONITORING')
          .length,

        managedProjects,

        activeSprints,

        upcomingSprints,
      },

      items,
    };
  }
}
