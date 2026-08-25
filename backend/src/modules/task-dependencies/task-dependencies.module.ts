import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TaskDependency } from './entities/task-dependency.entity';
import { Task } from '../task/entities/task.entity';

import { TaskDependenciesController } from './task-dependencies.controller';
import { TaskDependenciesService } from './task-dependencies.service';
import { Sprint } from '../sprints/entities/sprint.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskDependency, Task, Sprint])],

  controllers: [TaskDependenciesController],

  providers: [TaskDependenciesService],

  exports: [TaskDependenciesService],
})
export class TaskDependenciesModule {}
