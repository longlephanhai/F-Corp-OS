import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TaskDependency } from './entities/task-dependency.entity';
import { Task } from '../task/entities/task.entity';

import { TaskDependenciesController } from './task-dependencies.controller';
import { TaskDependenciesService } from './task-dependencies.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaskDependency, Task])],

  controllers: [TaskDependenciesController],

  providers: [TaskDependenciesService],

  exports: [TaskDependenciesService],
})
export class TaskDependenciesModule {}
