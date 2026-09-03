import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SprintsService } from './sprints.service';
import { SprintsController } from './sprints.controller';

import { Sprint } from './entities/sprint.entity';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../task/entities/task.entity';
import { UserSprint } from '../user-sprints/entities/user-sprint.entity';

import { TaskDependenciesModule } from '../task-dependencies/task-dependencies.module';
import { PmRealtimeModule } from '../pm-realtime/pm-realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sprint, Project, Task, UserSprint]),

    TaskDependenciesModule,

    PmRealtimeModule,
  ],

  controllers: [SprintsController],

  providers: [SprintsService],

  exports: [SprintsService],
})
export class SprintsModule {}
