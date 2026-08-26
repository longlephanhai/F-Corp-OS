import { Module } from '@nestjs/common';
import { TasksService } from './task.service';
import { TasksController } from './task.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { TaskDependenciesModule } from '../task-dependencies/task-dependencies.module';
import { Sprint } from '../sprints/entities/sprint.entity';
import { UserSprint } from '../user-sprints/entities/user-sprint.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, User, Sprint, UserSprint]),
    TaskDependenciesModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TaskModule {}
