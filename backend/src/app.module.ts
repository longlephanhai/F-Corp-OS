import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { User } from 'modules/users/entities/user.entity';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { Role } from 'modules/roles/entities/role.entity';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { Permission } from 'modules/permissions/entities/permission.entity';
import { DatabasesModule } from './modules/databases/databases.module';

import { SkillsModule } from './modules/skills/skills.module';
import { UserSkillModule } from './modules/user-skill/user-skill.module';
import { Skill } from 'modules/skills/entities/skill.entity';
import { UserSkill } from 'modules/user-skill/entities/user-skill.entity';
import { SkillEvidencesModule } from './modules/skill-evidences/skill-evidences.module';
import { SkillEvidence } from 'modules/skill-evidences/entities/skill-evidence.entity';

import { UserSprintsModule } from './modules/user-sprints/user-sprints.module';
import { TaskModule } from './modules/task/task.module';
import { SprintsModule } from './modules/sprints/sprints.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { Sprint } from 'modules/sprints/entities/sprint.entity';
import { Task } from 'modules/task/entities/task.entity';
import { UserSprint } from 'modules/user-sprints/entities/user-sprint.entity';
import { Project } from 'modules/projects/entities/project.entity';

import { HrReviewsModule } from './modules/hr-reviews/hr-reviews.module';
import { ReviewCycle } from 'modules/hr-reviews/entities/review-cycle.entity';
import { ReviewRecord } from 'modules/hr-reviews/entities/review-record.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
          Skill,
          UserSkill,
          User,
          Role,
          Permission,
          SkillEvidence,
          Project,
          Sprint,
          Task,
          UserSprint,
          ReviewCycle,
          ReviewRecord,
        ],
        synchronize: true,
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
    UserSprintsModule,
    TaskModule,
    SprintsModule,
    ProjectsModule,
    HrReviewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
