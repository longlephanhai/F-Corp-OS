import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { TaskDependenciesService } from './task-dependencies.service';

import { CreateTaskDependencyDto } from './dto/create-task-dependency.dto';
import { Public, SkipCheckPermission } from 'decorator/customize';


@SkipCheckPermission()
@Controller('tasks')
export class TaskDependenciesController {
  constructor(
    private readonly taskDependenciesService: TaskDependenciesService,
  ) {}

  // ==========================================
  // GET
  // ==========================================

  @Get(':taskId/dependencies')
  async getDependencies(
    @Param('taskId')
    taskId: string,
  ) {
    const data = await this.taskDependenciesService.getDependencies(taskId);

    return {
      statusCode: 200,

      message: 'Lấy Task Dependencies thành công',

      data,
    };
  }

  // ==========================================
  // STATUS
  // ==========================================

  @Get(':taskId/dependencies/status')
  async getDependencyStatus(
    @Param('taskId')
    taskId: string,
  ) {
    const data = await this.taskDependenciesService.getDependencyStatus(taskId);

    return {
      statusCode: 200,

      message: 'Lấy dependency status thành công',

      data,
    };
  }

  // ==========================================
  // CREATE
  // ==========================================

  @Post(':taskId/dependencies')
  async createDependency(
    @Param('taskId')
    taskId: string,

    @Body()
    body: CreateTaskDependencyDto,
  ) {
    const data = await this.taskDependenciesService.createDependency(
      taskId,

      body.dependsOnTaskId,
    );

    return {
      statusCode: 201,

      message: 'Đã thêm Task Dependency',

      data,
    };
  }

  // ==========================================
  // DELETE
  // ==========================================

  @Delete(':taskId/dependencies/:dependencyId')
  async removeDependency(
    @Param('taskId')
    taskId: string,

    @Param('dependencyId')
    dependencyId: string,
  ) {
    const data = await this.taskDependenciesService.removeDependency(
      taskId,
      dependencyId,
    );

    return {
      statusCode: 200,

      message: 'Đã xóa Task Dependency',

      data,
    };
  }
}
