import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Project } from '../projects/entities/project.entity';

import { ProjectManager } from '../projects/entities/project-manager.entity';

import { Sprint } from '../sprints/entities/sprint.entity';

import { Task } from '../task/entities/task.entity';

import { UserSprint } from '../user-sprints/entities/user-sprint.entity';

import { PmAccessService } from './pm-access.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectManager,
      Sprint,
      Task,
      UserSprint,
    ]),
  ],

  providers: [PmAccessService],

  exports: [PmAccessService],
})
export class PmAccessModule {}
