import { Module } from '@nestjs/common';
import { TasksService } from './task.service';
import { TasksController } from './task.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { TaskDependenciesModule } from '../task-dependencies/task-dependencies.module';

@Module({
  imports: [TypeOrmModule.forFeature([Task, User]), TaskDependenciesModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TaskModule {}
