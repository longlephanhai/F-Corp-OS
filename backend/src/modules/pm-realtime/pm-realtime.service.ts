import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Project } from '../projects/entities/project.entity';

import { ProjectManager } from '../projects/entities/project-manager.entity';

import { Sprint } from '../sprints/entities/sprint.entity';

import { NotificationsGateway } from '../notifications/notifications.gateway';

// ==========================================
// TYPES
// ==========================================

export type PmRealtimeEntity =
  | 'PROJECT'
  | 'PROJECT_MANAGER'
  | 'SPRINT'
  | 'TASK'
  | 'TASK_DEPENDENCY'
  | 'ALLOCATION'
  | 'EVIDENCE';

export type PmRealtimeAction =
  | 'CREATED'
  | 'UPDATED'
  | 'DELETED'
  | 'STATUS_CHANGED'
  | 'ASSIGNED'
  | 'RELEASED'
  | 'CARRIED_OVER'
  | 'MANAGER_ADDED'
  | 'MANAGER_REMOVED'
  | 'DEPENDENCY_CHANGED';

export interface PublishProjectChangeInput {
  projectId: string;

  sprintId?: string | null;

  entity: PmRealtimeEntity;

  action: PmRealtimeAction;

  entityId?: string | null;

  // Dùng cho trường hợp vừa REMOVE Co-PM.
  //
  // Vì sau khi relation bị xóa,
  // user đó không còn nằm trong
  // project_managers để resolver tìm ra nữa.
  extraUserIds?: string[];
}

@Injectable()
export class PmRealtimeService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    @InjectRepository(ProjectManager)
    private readonly projectManagerRepo: Repository<ProjectManager>,

    @InjectRepository(Sprint)
    private readonly sprintRepo: Repository<Sprint>,

    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  // ==========================================
  // PUBLISH BY PROJECT
  // ==========================================

  async publishProjectChanged(input: PublishProjectChangeInput) {
    const project = await this.projectRepo.findOne({
      where: {
        id: input.projectId,
      },
    });

    if (!project) {
      // Realtime không được làm business API fail.
      //
      // Mutation DB thành công vẫn phải giữ
      // kết quả thành công dù realtime lookup lỗi.
      console.warn(`[PM Realtime] Project ${input.projectId} không tồn tại.`);

      return;
    }

    // ========================================
    // PRIMARY + CO-PM
    // ========================================

    const managerRelations = await this.projectManagerRepo.find({
      where: {
        projectId: project.id,
      },
    });

    const userIds = new Set<string>();

    // Legacy Primary PM.
    if (project.pmId) {
      userIds.add(project.pmId);
    }

    // New Multi-PM relation.
    managerRelations.forEach((manager) => {
      if (manager.userId) {
        userIds.add(manager.userId);
      }
    });

    // Ví dụ Co-PM vừa bị remove.
    input.extraUserIds?.forEach((userId) => {
      if (userId) {
        userIds.add(userId);
      }
    });

    const payload = {
      type: 'PM_PROJECT_CHANGED',

      projectId: project.id,

      sprintId: input.sprintId ?? null,

      entity: input.entity,

      action: input.action,

      entityId: input.entityId ?? null,

      occurredAt: new Date().toISOString(),
    };

    userIds.forEach((userId) => {
      this.notificationsGateway.emitEventToUser(
        userId,
        'pm_project_changed',
        payload,
      );
    });

    console.log(
      `[PM Realtime] ${input.entity}:${input.action} project:${project.id} → ${userIds.size} PM(s)`,
    );
  }

  // ==========================================
  // PUBLISH BY SPRINT
  // ==========================================

  async publishSprintChanged(
    sprintId: string,
    input: {
      entity: PmRealtimeEntity;

      action: PmRealtimeAction;

      entityId?: string | null;
    },
  ) {
    const sprint = await this.sprintRepo.findOne({
      where: {
        id: sprintId,
      },
    });

    if (!sprint) {
      console.warn(`[PM Realtime] Sprint ${sprintId} không tồn tại.`);

      return;
    }

    await this.publishProjectChanged({
      projectId: sprint.projectId,

      sprintId: sprint.id,

      entity: input.entity,

      action: input.action,

      entityId: input.entityId ?? null,
    });
  }
}
