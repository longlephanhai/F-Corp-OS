import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { SkipCheckPermission } from 'decorator/customize';

import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

import { PmAccessService } from '../pm-access/pm-access.service';

import { TasksService } from './task.service';

import { UpdateTaskLifecycleDto } from './dto/update-task-lifecycle.dto';

import { UpdateTaskAssigneeDto } from './dto/update-task-assignee.dto';

import { UpdateTaskTimelineDto } from './dto/update-task-timeline.dto';

import { UpdateTaskDto } from './dto/update-task.dto';

import { CarryOverTaskDto } from './dto/carry-over-task.dto';

@UseGuards(JwtAuthGuard)
@SkipCheckPermission()
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,

    private readonly pmAccessService: PmAccessService,
  ) {}

  // ==========================================
  // GET TASKS BY SPRINT
  //
  // GET /tasks/sprint/:sprintId
  // ==========================================

  @Get('sprint/:sprintId')
  async getTasksBySprint(
    @Param('sprintId')
    sprintId: string,

    @Req()
    req: any,
  ) {
    await this.pmAccessService.assertSprintAccess(req.user.id, sprintId);

    const data = await this.tasksService.getTasksBySprint(sprintId);

    return {
      statusCode: 200,

      message: 'Lấy danh sách Task theo Sprint thành công',

      data,
    };
  }

  // ==========================================
  // MATCHING CANDIDATES
  //
  // GET /tasks/:taskId/candidates
  // ==========================================

  @Get(':taskId/candidates')
  async getMatchingCandidates(
    @Param('taskId')
    taskId: string,

    @Req()
    req: any,
  ) {
    await this.pmAccessService.assertTaskAccess(req.user.id, taskId);

    const data = await this.tasksService.getMatchingCandidates(taskId);

    return {
      statusCode: 200,

      message: 'Lấy danh sách ứng viên thành công',

      data,
    };
  }

  // ==========================================
  // CARRY-OVER HISTORY
  //
  // GET /tasks/:taskId/carry-over-history
  //
  // Khác assertTaskAccess():
  // history cho phép Task source đã archive.
  // ==========================================

  @Get(':taskId/carry-over-history')
  async getTaskCarryOverHistory(
    @Param('taskId')
    taskId: string,

    @Req()
    req: any,
  ) {
    await this.pmAccessService.assertTaskHistoryAccess(req.user.id, taskId);

    const data = await this.tasksService.getTaskCarryOverHistory(taskId);

    return {
      statusCode: 200,

      message: 'Lấy lịch sử Carry-over Task thành công',

      data,
    };
  }

  // ==========================================
  // CREATE TASK
  //
  // POST /tasks
  //
  // PM phải quản lý Project chứa Sprint.
  // ==========================================

  @Post()
  async createTask(
    @Body()
    body: any,

    @Req()
    req: any,
  ) {
    // Giữ SPRINT_REQUIRED trong TasksService
    // nếu frontend không truyền sprintId.
    if (body?.sprintId) {
      await this.pmAccessService.assertSprintAccess(req.user.id, body.sprintId);
    }

    const data = await this.tasksService.createTask(body);

    return {
      statusCode: 201,

      message: 'Tạo Task mới thành công',

      data,
    };
  }

  // ==========================================
  // UPDATE ASSIGNEE
  //
  // PATCH /tasks/:taskId/assignee
  // ==========================================

  @Patch(':taskId/assignee')
  async updateTaskAssignee(
    @Param('taskId')
    taskId: string,

    @Body()
    body: UpdateTaskAssigneeDto,

    @Req()
    req: any,
  ) {
    await this.pmAccessService.assertTaskAccess(req.user.id, taskId);

    // Phải gửi field userId,
    // kể cả khi muốn unassign bằng null.
    if (!Object.prototype.hasOwnProperty.call(body, 'userId')) {
      throw new BadRequestException({
        code: 'USER_ID_REQUIRED',

        message: 'Payload phải chứa userId.',
      });
    }

    const data = await this.tasksService.updateTaskAssignee(
      taskId,
      body.userId ?? null,
    );

    return {
      statusCode: 200,

      message: body.userId
        ? 'Gán owner cho Task thành công'
        : 'Đã bỏ owner khỏi Task',

      data,
    };
  }

  // ==========================================
  // UPDATE TIMELINE
  //
  // PATCH /tasks/:taskId/timeline
  // ==========================================

  @Patch(':taskId/timeline')
  async updateTaskTimeline(
    @Param('taskId')
    taskId: string,

    @Body()
    body: UpdateTaskTimelineDto,

    @Req()
    req: any,
  ) {
    await this.pmAccessService.assertTaskAccess(req.user.id, taskId);

    const data = await this.tasksService.updateTaskTimeline(taskId, body);

    return {
      statusCode: 200,

      message: 'Cập nhật timeline Task thành công',

      data,
    };
  }

  // ==========================================
  // UPDATE LIFECYCLE
  //
  // PATCH /tasks/:taskId/lifecycle
  // ==========================================

  @Patch(':taskId/lifecycle')
  async updateTaskLifecycle(
    @Param('taskId')
    taskId: string,

    @Body()
    body: UpdateTaskLifecycleDto,

    @Req()
    req: any,
  ) {
    await this.pmAccessService.assertTaskAccess(req.user.id, taskId);

    const data = await this.tasksService.updateTaskLifecycle(taskId, body);

    return {
      statusCode: 200,

      message: 'Cập nhật Task thành công',

      data,
    };
  }

  // ==========================================
  // CARRY-OVER TASK
  //
  // POST /tasks/:taskId/carry-over
  //
  // Kiểm tra CẢ:
  // - Sprint nguồn
  // - Sprint đích
  // ==========================================

  @Post(':taskId/carry-over')
  async carryOverTask(
    @Param('taskId')
    taskId: string,

    @Body()
    body: CarryOverTaskDto,

    @Req()
    req: any,
  ) {
    // ========================================
    // SOURCE TASK
    // ========================================

    await this.pmAccessService.assertTaskAccess(req.user.id, taskId);

    // ========================================
    // TARGET SPRINT
    // ========================================

    await this.pmAccessService.assertSprintAccess(
      req.user.id,
      body.targetSprintId,
    );

    const data = await this.tasksService.carryOverTask(taskId, body);

    return {
      statusCode: 201,

      message: 'Carry-over Task thành công',

      data,
    };
  }

  // ==========================================
  // GUARDED TASK EDITING
  //
  // PATCH /tasks/:taskId
  //
  // Generic PATCH đặt sau các PATCH cụ thể.
  // ==========================================

  @Patch(':taskId')
  async updateTask(
    @Param('taskId')
    taskId: string,

    @Body()
    body: UpdateTaskDto,

    @Req()
    req: any,
  ) {
    await this.pmAccessService.assertTaskAccess(req.user.id, taskId);

    const data = await this.tasksService.updateTask(taskId, body);

    return {
      statusCode: 200,

      message: 'Cập nhật thông tin Task thành công',

      data,
    };
  }

  // ==========================================
  // ARCHIVE TASK
  //
  // DELETE /tasks/:taskId
  // ==========================================

  @Delete(':taskId')
  async removeTask(
    @Param('taskId')
    taskId: string,

    @Req()
    req: any,
  ) {
    await this.pmAccessService.assertTaskAccess(req.user.id, taskId);

    const data = await this.tasksService.removeTask(taskId);

    return {
      statusCode: 200,

      message: 'Lưu trữ Task thành công',

      data,
    };
  }
}
