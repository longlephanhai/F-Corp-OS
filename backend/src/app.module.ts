import { Module } from '@nestjs/common';

import { ConfigModule, ConfigService } from '@nestjs/config';

import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// ==========================================
// USERS
// ==========================================

import { UsersModule } from './modules/users/users.module';
import { User } from 'modules/users/entities/user.entity';

// ==========================================
// AUTH
// ==========================================

import { AuthModule } from './modules/auth/auth.module';

// ==========================================
// ROLES / PERMISSIONS
// ==========================================

import { RolesModule } from './modules/roles/roles.module';
import { Role } from 'modules/roles/entities/role.entity';

import { PermissionsModule } from './modules/permissions/permissions.module';
import { Permission } from 'modules/permissions/entities/permission.entity';

// ==========================================
// DATABASE INITIALIZATION
// ==========================================

import { DatabasesModule } from './modules/databases/databases.module';

// ==========================================
// SKILLS
// ==========================================

import { SkillsModule } from './modules/skills/skills.module';
import { Skill } from 'modules/skills/entities/skill.entity';

import { UserSkillModule } from './modules/user-skill/user-skill.module';
import { UserSkill } from 'modules/user-skill/entities/user-skill.entity';

import { SkillEvidencesModule } from './modules/skill-evidences/skill-evidences.module';
import { SkillEvidence } from 'modules/skill-evidences/entities/skill-evidence.entity';

// ==========================================
// PROJECT / SPRINT / TASK
// ==========================================

import { ProjectsModule } from './modules/projects/projects.module';
import { Project } from 'modules/projects/entities/project.entity';

import { SprintsModule } from './modules/sprints/sprints.module';
import { Sprint } from 'modules/sprints/entities/sprint.entity';

import { TaskModule } from './modules/task/task.module';
import { Task } from 'modules/task/entities/task.entity';

// ==========================================
// USER SPRINT / RESOURCE ALLOCATION
// ==========================================

import { UserSprintsModule } from './modules/user-sprints/user-sprints.module';
import { UserSprint } from 'modules/user-sprints/entities/user-sprint.entity';

// ==========================================
// TASK DEPENDENCIES
// ==========================================

import { TaskDependenciesModule } from './modules/task-dependencies/task-dependencies.module';

import { TaskDependency } from './modules/task-dependencies/entities/task-dependency.entity';

// ==========================================
// HR REVIEWS
// ==========================================

import { HrReviewsModule } from './modules/hr-reviews/hr-reviews.module';

import { ReviewCycle } from 'modules/hr-reviews/entities/review-cycle.entity';

import { ReviewRecord } from 'modules/hr-reviews/entities/review-record.entity';

// ==========================================
// HR WALLET
// ==========================================

import { HrWalletsModule } from './modules/hr-wallets/hr-wallets.module';

import { Wallet } from 'modules/hr-wallets/entities/wallet.entity';

import { TransactionHistory } from 'modules/hr-wallets/entities/transaction-history.entity';

// ==========================================
// NOTIFICATIONS
// ==========================================

import { NotificationsModule } from 'modules/notifications/notifications.module';

import { Notification } from 'modules/notifications/entities/notification.entity';

// ==========================================
// WEBSOCKET
// ==========================================

import { WebsocketModule } from 'websockets/websocket.module';

import { Websocket } from 'websockets/entities/websocket.entity';

// ==========================================
// APP MODULE
// ==========================================

@Module({
  imports: [
    // ========================================
    // CONFIG
    // ========================================

    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // ========================================
    // TYPEORM
    // ========================================

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],

      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',

        host: configService.get<string>('DATABASE_HOST'),

        port: configService.get<number>('DATABASE_PORT', 3306),

        username: configService.get<string>('DATABASE_USER'),

        password: configService.get<string>('DATABASE_PASSWORD'),

        database: configService.get<string>('DATABASE_NAME'),

        // ====================================
        // ENTITIES
        // ====================================

        entities: [
          // USER / AUTH
          User,
          Role,
          Permission,

          // SKILLS
          Skill,
          UserSkill,
          SkillEvidence,

          // PROJECT MANAGEMENT
          Project,
          Sprint,
          Task,
          UserSprint,

          // TASK DEPENDENCIES
          TaskDependency,

          // HR
          ReviewCycle,
          ReviewRecord,

          // WALLET
          Wallet,
          TransactionHistory,

          // NOTIFICATION
          Notification,

          // WEBSOCKET
          Websocket,
        ],

        // Không bật synchronize
        // vì project đang quản lý schema thủ công.
        synchronize: false,
      }),

      inject: [ConfigService],
    }),

    // ========================================
    // APPLICATION MODULES
    // ========================================

    UsersModule,

    AuthModule,

    RolesModule,

    PermissionsModule,

    DatabasesModule,

    // ========================================
    // SKILL MODULES
    // ========================================

    SkillsModule,

    UserSkillModule,

    SkillEvidencesModule,

    // ========================================
    // PM MODULES
    // ========================================

    ProjectsModule,

    SprintsModule,

    TaskModule,

    UserSprintsModule,

    // QUAN TRỌNG:
    // Module phải nằm trong imports,
    // KHÔNG nằm trong entities.
    TaskDependenciesModule,

    // ========================================
    // HR MODULES
    // ========================================

    HrReviewsModule,

    HrWalletsModule,

    // ========================================
    // NOTIFICATION / SOCKET
    // ========================================

    NotificationsModule,

    WebsocketModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}
