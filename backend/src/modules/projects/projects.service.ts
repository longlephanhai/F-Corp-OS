import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Project } from './entities/project.entity';

import {
  ProjectManager,
  ProjectManagerRole,
} from './entities/project-manager.entity';

import { User } from '../users/entities/user.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    @InjectRepository(ProjectManager)
    private readonly projectManagerRepo: Repository<ProjectManager>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ==========================================
  // CREATE PROJECT
  //
  // projects.pmId vẫn là Primary PM.
  //
  // project_managers lưu:
  // - PRIMARY
  // - CO_MANAGER
  //
  // Hai record được tạo trong cùng transaction.
  // ==========================================

  async createProject(data: any) {
    // ========================================
    // PRIMARY PM REQUIRED
    // ========================================

    if (!data.pmId) {
      throw new BadRequestException({
        code: 'PROJECT_PRIMARY_PM_REQUIRED',

        message: 'Project phải có Primary PM.',
      });
    }

    // ========================================
    // VALIDATE PRIMARY PM USER
    // ========================================

    const primaryPm = await this.userRepo.findOne({
      where: {
        id: data.pmId,

        isDeleted: false,
      },
    });

    if (!primaryPm) {
      throw new NotFoundException({
        code: 'PROJECT_PRIMARY_PM_NOT_FOUND',

        message: 'Không tìm thấy Primary PM.',
      });
    }

    // ========================================
    // TRANSACTION
    // ========================================

    return await this.projectRepo.manager.transaction(async (manager) => {
      const projectRepo = manager.getRepository(Project);

      const managerRepo = manager.getRepository(ProjectManager);

      // ======================================
      // CREATE PROJECT
      // ======================================

      const newProject = projectRepo.create({
        name: data.name,

        description: data.description,

        startDate: data.startDate,

        endDate: data.endDate,

        status: 'active',

        // ====================================
        // LEGACY + SOURCE OF PRIMARY PM
        // ====================================

        pmId: primaryPm.id,

        isDeleted: false,
      });

      const savedProject = await projectRepo.save(newProject);

      // ======================================
      // CREATE PRIMARY MANAGER RELATION
      // ======================================

      const primaryManager = managerRepo.create({
        projectId: savedProject.id,

        userId: primaryPm.id,

        managerRole: ProjectManagerRole.PRIMARY,
      });

      await managerRepo.save(primaryManager);

      return savedProject;
    });
  }

  // ==========================================
  // GET PROJECT BY ID
  // ==========================================

  async getProjectById(id: string) {
    const project = await this.projectRepo.findOne({
      where: {
        id,

        isDeleted: false,
      },

      relations: {
        // Primary PM legacy relation.
        pm: true,

        // Primary + Co-PMs.
        managers: {
          user: true,
        },
      },
    });

    if (!project) {
      throw new NotFoundException({
        code: 'PROJECT_NOT_FOUND',

        message: 'Không tìm thấy Dự án này.',
      });
    }

    return project;
  }

  // ==========================================
  // GET ALL PROJECTS
  //
  // Đây là generic/admin list.
  // PM-specific list dùng getMyProjects().
  // ==========================================

  async getAllProjects() {
    return await this.projectRepo.find({
      where: {
        isDeleted: false,
      },

      relations: {
        pm: true,

        managers: {
          user: true,
        },
      },

      order: {
        startDate: 'DESC',
      },
    });
  }

  // ==========================================
  // GET MY PROJECTS
  //
  // User nhìn thấy Project khi:
  //
  // 1. project.pmId === userId
  //    -> Primary PM
  //
  // HOẶC
  //
  // 2. Có relation trong project_managers
  //    -> Primary / Co-PM
  // ==========================================

  async getMyProjects(pmId: string) {
    return await this.projectRepo
      .createQueryBuilder('project')

      // ========================================
      // PRIMARY PM
      // ========================================

      .leftJoinAndSelect('project.pm', 'primaryPm')

      // ========================================
      // PROJECT MANAGERS
      // ========================================

      .leftJoinAndSelect('project.managers', 'projectManagers')

      .leftJoinAndSelect('projectManagers.user', 'managerUser')

      // ========================================
      // ACTIVE RECORD ONLY
      // ========================================

      .where('project.isDeleted = :isDeleted', {
        isDeleted: false,
      })

      // ========================================
      // PRIMARY PM OR CO-PM
      // ========================================

      .andWhere(
        `
        (
          project.pmId = :pmId

          OR EXISTS (
            SELECT 1
            FROM project_managers scopeManager
            WHERE scopeManager.project_id = project.id
              AND scopeManager.user_id = :pmId
          )
        )
        `,
        {
          pmId,
        },
      )

      // Join managers có thể sinh duplicate Project.
      .distinct(true)

      .orderBy('project.startDate', 'DESC')

      .getMany();
  }

  // ==========================================
  // SEARCH PROJECT MANAGER CANDIDATES
  // ==========================================

  async searchProjectManagerCandidates(projectId: string, search?: string) {
    const project = await this.getProjectOrFail(projectId);

    const query = this.userRepo
      .createQueryBuilder('user')

      .leftJoinAndSelect('user.role', 'role')

      .where('user.isDeleted = :isDeleted', {
        isDeleted: false,
      })

      // ======================================
      // PM ROLE ONLY
      //
      // Support:
      // PM
      // Project Manager
      // PROJECT_MANAGER
      // project-manager
      // ======================================

      .andWhere(
        `
        UPPER(
          REPLACE(
            REPLACE(
              REPLACE(
                role.name,
                ' ',
                ''
              ),
              '_',
              ''
            ),
            '-',
            ''
          )
        ) IN ('PM', 'PROJECTMANAGER')
        `,
      )

      // ======================================
      // PRIMARY PM NOT CANDIDATE
      // ======================================

      .andWhere('user.id != :primaryPmId', {
        primaryPmId: project.pmId,
      })

      // ======================================
      // ALREADY ASSIGNED MANAGERS EXCLUDED
      // ======================================

      .andWhere(
        `
        NOT EXISTS (
          SELECT 1
          FROM project_managers existingManager
          WHERE existingManager.project_id = :projectId
            AND existingManager.user_id = user.id
        )
        `,
        {
          projectId,
        },
      );

    const normalizedSearch = search?.trim();

    if (normalizedSearch) {
      query.andWhere(
        `
      (
        user.fullName LIKE :search
        OR user.email LIKE :search
      )
      `,
        {
          search: `%${normalizedSearch}%`,
        },
      );
    }

    const users = await query
      .orderBy('user.fullName', 'ASC')
      .take(20)
      .getMany();

    return users.map((user) => ({
      id: user.id,

      fullName: user.fullName,

      email: user.email,

      title: user.title,

      status: user.status,

      role: user.role
        ? {
            id: user.role.id,

            name: user.role.name,
          }
        : null,
    }));
  }
  // ==========================================
  // GET PROJECT MANAGERS
  // ==========================================

  async getProjectManagers(projectId: string) {
    await this.getProjectOrFail(projectId);

    return await this.projectManagerRepo.find({
      where: {
        projectId,
      },

      relations: {
        user: true,
      },

      order: {
        createdAt: 'ASC',
      },
    });
  }

  // ==========================================
  // ADD CO-MANAGER
  // ==========================================

  async addProjectManager(projectId: string, userId: string) {
    const project = await this.getProjectOrFail(projectId);

    // ========================================
    // PRIMARY PM CANNOT BE ADDED AGAIN
    // ========================================

    if (project.pmId === userId) {
      throw new ConflictException({
        code: 'PROJECT_MANAGER_ALREADY_PRIMARY',

        message: 'User này đã là Primary PM của Project.',
      });
    }

    // ========================================
    // USER EXISTS
    // ========================================

    const user = await this.userRepo.findOne({
      where: {
        id: userId,

        isDeleted: false,
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'PROJECT_MANAGER_USER_NOT_FOUND',

        message: 'Không tìm thấy User để gán làm Project Manager.',
      });
    }
    // ========================================
    // USER MUST HAVE PM ROLE
    // ========================================

    if (!this.isProjectManagerRole(user.role?.name)) {
      throw new ConflictException({
        code: 'USER_IS_NOT_PROJECT_MANAGER',

        message: 'Chỉ User có role Project Manager mới được gán làm Co-PM.',

        userId: user.id,

        role: user.role?.name ?? null,
      });
    }
    // ========================================
    // DUPLICATE RELATION
    // ========================================

    const existing = await this.projectManagerRepo.findOne({
      where: {
        projectId,

        userId,
      },
    });

    if (existing) {
      throw new ConflictException({
        code: 'PROJECT_MANAGER_ALREADY_ASSIGNED',

        message: 'User này đã là Manager của Project.',
      });
    }

    // ========================================
    // CREATE CO-PM
    // ========================================

    const relation = this.projectManagerRepo.create({
      projectId,

      userId,

      managerRole: ProjectManagerRole.CO_MANAGER,
    });

    await this.projectManagerRepo.save(relation);

    // Trả lại full manager list để frontend
    // refresh trực tiếp sau khi thêm.
    return await this.getProjectManagers(projectId);
  }

  // ==========================================
  // REMOVE CO-MANAGER
  // ==========================================

  async removeProjectManager(projectId: string, userId: string) {
    const project = await this.getProjectOrFail(projectId);

    // ========================================
    // PRIMARY PM CANNOT BE REMOVED
    // ========================================

    if (project.pmId === userId) {
      throw new ConflictException({
        code: 'PRIMARY_PM_CANNOT_REMOVE',

        message: 'Không thể xóa Primary PM bằng chức năng Co-PM.',
      });
    }

    // ========================================
    // FIND RELATION
    // ========================================

    const relation = await this.projectManagerRepo.findOne({
      where: {
        projectId,

        userId,
      },
    });

    if (!relation) {
      throw new NotFoundException({
        code: 'PROJECT_MANAGER_NOT_FOUND',

        message: 'User không phải Manager của Project.',
      });
    }

    // Guard thêm để DB bị lệch dữ liệu
    // vẫn không vô tình xóa PRIMARY.
    if (relation.managerRole === ProjectManagerRole.PRIMARY) {
      throw new ConflictException({
        code: 'PRIMARY_PM_CANNOT_REMOVE',

        message: 'Primary PM không thể bị xóa bằng endpoint này.',
      });
    }

    // ========================================
    // DELETE RELATION ONLY
    //
    // Không xóa User.
    // Không xóa Project.
    // ========================================

    await this.projectManagerRepo.delete(relation.id);

    return {
      success: true,

      projectId,

      userId,

      message: 'Đã xóa Co-PM khỏi Project.',
    };
  }

  // ==========================================
  // PROJECT DETAIL + BUDGET
  // ==========================================

  async getProjectDetailWithBudget(projectId: string) {
    // ========================================
    // LOAD PROJECT
    // ========================================

    const project = await this.projectRepo.findOne({
      where: {
        id: projectId,

        isDeleted: false,
      },

      relations: {
        // Primary PM.
        pm: true,

        // Primary + Co-PMs.
        managers: {
          user: true,
        },

        // Existing PM flow.
        sprints: {
          tasks: true,
        },
      },
    });

    if (!project) {
      throw new NotFoundException({
        code: 'PROJECT_NOT_FOUND',

        message: 'Không tìm thấy dự án!',
      });
    }

    // ========================================
    // BUDGET ROLL-UP
    // ========================================

    let totalBudget = 0;

    if (project.sprints?.length > 0) {
      project.sprints.forEach((sprint) => {
        if (!sprint.tasks?.length) {
          return;
        }

        sprint.tasks.forEach((task) => {
          // Không tính Task archive vào current budget.
          if (task.isDeleted) {
            return;
          }

          totalBudget += Number(task.budgetRate ?? 0);
        });
      });
    }

    // ========================================
    // RESULT
    // ========================================

    return {
      ...project,

      totalBudget,
    };
  }

  private isProjectManagerRole(roleName?: string | null) {
    const normalized = (roleName ?? '')
      .trim()
      .toUpperCase()
      .replace(/[\s_-]+/g, '');

    return normalized === 'PM' || normalized === 'PROJECTMANAGER';
  }

  // ==========================================
  // INTERNAL PROJECT LOOKUP
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

        message: 'Không tìm thấy Project.',
      });
    }

    return project;
  }
}
