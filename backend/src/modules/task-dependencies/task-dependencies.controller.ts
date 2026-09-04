import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { SkipCheckPermission } from 'decorator/customize';

import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

import { PmAccessService } from '../pm-access/pm-access.service';

import { TaskDependenciesService } from './task-dependencies.service';

import { CreateTaskDependencyDto } from './dto/create-task-dependency.dto';

@UseGuards(JwtAuthGuard)
@SkipCheckPermission()
@Controller('tasks')
export class TaskDependenciesController {
  constructor(
    private readonly taskDependenciesService: TaskDependenciesService,

    private readonly pmAccessService: PmAccessService,
  ) {}

  // ==========================================
  // GET DEPENDENCIES
  //
  // GET /tasks/:taskId/dependencies
  // ==========================================

  @Get(':taskId/dependencies')
  async getDependencies(
    @Param('taskId')
    taskId: string,

    @Req()
    req: any,
  ) {
    await this.pmAccessService.assertTaskAccess(req.user.id, taskId);

    const data = await this.taskDependenciesService.getDependencies(taskId);

    return {
      statusCode: 200,

      message: 'Lấy Task Dependencies thành công',

      data,
    };
  }

  // ==========================================
  // DEPENDENCY STATUS
  //
  // GET /tasks/:taskId/dependencies/status
  // ==========================================

  @Get(':taskId/dependencies/status')
  async getDependencyStatus(
    @Param('taskId')
    taskId: string,

    @Req()
    req: any,
  ) {
    await this.pmAccessService.assertTaskAccess(req.user.id, taskId);

    const data = await this.taskDependenciesService.getDependencyStatus(taskId);

    return {
      statusCode: 200,

      message: 'Lấy dependency status thành công',

      data,
    };
  }

  // ==========================================
  // CREATE DEPENDENCY
  //
  // POST /tasks/:taskId/dependencies
  //
  // Check cả:
  // - dependent Task
  // - prerequisite Task
  //
  // Service vẫn chịu trách nhiệm:
  // - same Sprint
  // - no cycle
  // - no duplicate
  // - timeline
  // ==========================================

  @Post(':taskId/dependencies')
  async createDependency(
    @Param('taskId')
    taskId: string,

    @Body()
    body: CreateTaskDependencyDto,

    @Req()
    req: any,
  ) {
    // ========================================
    // TARGET TASK
    // ========================================

    await this.pmAccessService.assertTaskAccess(req.user.id, taskId);

    // ========================================
    // PREREQUISITE TASK
    // ========================================

    await this.pmAccessService.assertTaskAccess(
      req.user.id,
      body.dependsOnTaskId,
    );

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
  // DELETE DEPENDENCY
  //
  // DELETE
  // /tasks/:taskId/dependencies/:dependencyId
  // ==========================================

  @Delete(':taskId/dependencies/:dependencyId')
  async removeDependency(
    @Param('taskId')
    taskId: string,

    @Param('dependencyId')
    dependencyId: string,

    @Req()
    req: any,
  ) {
    await this.pmAccessService.assertTaskAccess(req.user.id, taskId);

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
