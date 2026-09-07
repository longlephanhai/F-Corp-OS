import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Project } from '../projects/entities/project.entity';

import { Sprint } from '../sprints/entities/sprint.entity';

import { Task } from '../task/entities/task.entity';

import { UserSprint } from '../user-sprints/entities/user-sprint.entity';

import { SprintsModule } from '../sprints/sprints.module';

import { PmActionCenterController } from './pm-action-center.controller';

import { PmActionCenterService } from './pm-action-center.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Sprint, Task, UserSprint]),

    SprintsModule,
  ],

  controllers: [PmActionCenterController],

  providers: [PmActionCenterService],
})
export class PmActionCenterModule {}
