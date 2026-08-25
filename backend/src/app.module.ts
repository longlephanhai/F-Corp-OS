import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { User } from 'modules/users/entities/user.entity';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { Role } from 'modules/roles/entities/role.entity';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { Permission } from 'modules/permissions/entities/permission.entity';
import { DatabasesModule } from './modules/databases/databases.module';
import { SkillsModule } from './modules/skills/skills.module';
import { Skill } from 'modules/skills/entities/skill.entity';

import { UserSkillModule } from './modules/user-skill/user-skill.module';
import { UserSkill } from 'modules/user-skill/entities/user-skill.entity';

import { SkillEvidencesModule } from './modules/skill-evidences/skill-evidences.module';
import { SkillEvidence } from 'modules/skill-evidences/entities/skill-evidence.entity';
import { ProjectsModule } from './modules/projects/projects.module';
import { Project } from 'modules/projects/entities/project.entity';
import { SprintsModule } from './modules/sprints/sprints.module';
import { Sprint } from 'modules/sprints/entities/sprint.entity';
import { TaskModule } from './modules/task/task.module';
import { Task } from 'modules/task/entities/task.entity';
import { UserSprintsModule } from './modules/user-sprints/user-sprints.module';
import { UserSprint } from 'modules/user-sprints/entities/user-sprint.entity';
import { TaskDependenciesModule } from './modules/task-dependencies/task-dependencies.module';
import { TaskDependency } from './modules/task-dependencies/entities/task-dependency.entity';
import { HrReviewsModule } from './modules/hr-reviews/hr-reviews.module';
import { ReviewCycle } from 'modules/hr-reviews/entities/review-cycle.entity';
import { ReviewRecord } from 'modules/hr-reviews/entities/review-record.entity';
import { HrWalletsModule } from './modules/hr-wallets/hr-wallets.module';
import { HrTalentsModule } from './modules/hr-talents/hr-talents.module';
import { Wallet } from 'modules/hr-wallets/entities/wallet.entity';
import { TransactionHistory } from 'modules/hr-wallets/entities/transaction-history.entity';
import { NotificationsModule } from 'modules/notifications/notifications.module';
import { Notification } from 'modules/notifications/entities/notification.entity';
import { WebsocketModule } from 'websockets/websocket.module';
import { Websocket } from 'websockets/entities/websocket.entity';
@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],

      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT', 3306),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [
          User,
          Role,
          Permission,
          Skill,
          UserSkill,
          SkillEvidence,
          Project,
          Sprint,
          Task,
          UserSprint,
          TaskDependency,
          ReviewCycle,
          ReviewRecord,
          Wallet,
          TransactionHistory,
          Notification,
          Websocket,
        ],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    RolesModule,
    PermissionsModule,
    DatabasesModule,
    SkillsModule,
    UserSkillModule,
    SkillEvidencesModule,
    ProjectsModule,
    SprintsModule,
    TaskModule,
    UserSprintsModule,
    TaskDependenciesModule,
    HrReviewsModule,
    HrWalletsModule,
    HrTalentsModule,
    NotificationsModule,
    WebsocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
