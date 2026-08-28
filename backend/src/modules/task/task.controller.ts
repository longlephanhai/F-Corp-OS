import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  BadRequestException,
  Delete,
} from '@nestjs/common';
import { SkipCheckPermission } from 'decorator/customize';
import { TasksService } from './task.service';
import { UpdateTaskLifecycleDto } from './dto/update-task-lifecycle.dto';
import { UpdateTaskAssigneeDto } from './dto/update-task-assignee.dto';
import { UpdateTaskTimelineDto } from './dto/update-task-timeline.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CarryOverTaskDto } from './dto/carry-over-task.dto';

@SkipCheckPermission()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('sprint/:sprintId')
  async getTasksBySprint(@Param('sprintId') sprintId: string) {
    const data = await this.tasksService.getTasksBySprint(sprintId);
    return {
      statusCode: 200,
      message: 'Lấy danh sách Task theo Sprint thành công',
      data,
    };
  }

  @Get(':taskId/candidates')
  async getMatchingCandidates(@Param('taskId') taskId: string) {
    const data = await this.tasksService.getMatchingCandidates(taskId);
    return {
      statusCode: 200,
      message: 'Lấy danh sách ứng viên thành công',
      data,
    };
  }

  // Tương ứng với: pmApi.createTask
  @Post()
  async createTask(@Body() body: any) {
    const data = await this.tasksService.createTask(body);
    return { statusCode: 201, message: 'Tạo Task mới thành công', data };
  }

  @Patch(':taskId/assignee')
  async updateTaskAssignee(
    @Param('taskId')
    taskId: string,

    @Body()
    body: UpdateTaskAssigneeDto,
  ) {
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

  @Patch(':taskId/timeline')
  async updateTaskTimeline(
    @Param('taskId')
    taskId: string,

    @Body()
    body: UpdateTaskTimelineDto,
  ) {
    const data = await this.tasksService.updateTaskTimeline(taskId, body);

    return {
      statusCode: 200,

      message: 'Cập nhật timeline Task thành công',

      data,
    };
  }

  @Patch(':taskId/lifecycle')
  async updateTaskLifecycle(
    @Param('taskId')
    taskId: string,

    @Body()
    body: UpdateTaskLifecycleDto,
  ) {
    const data = await this.tasksService.updateTaskLifecycle(taskId, body);

    return {
      statusCode: 200,
      message: 'Cập nhật Task thành công',
      data,
    };
  }
  @Post(':taskId/carry-over')
  async carryOverTask(
    @Param('taskId')
    taskId: string,

    @Body()
    body: CarryOverTaskDto,
  ) {
    const data = await this.tasksService.carryOverTask(taskId, body);

    return {
      statusCode: 201,

      message: 'Carry-over Task thành công',

      data,
    };
  }

  @Patch(':taskId')
  async updateTask(
    @Param('taskId')
    taskId: string,

    @Body()
    body: UpdateTaskDto,
  ) {
    const data = await this.tasksService.updateTask(taskId, body);

    return {
      statusCode: 200,

      message: 'Cập nhật thông tin Task thành công',

      data,
    };
  }
  @Delete(':taskId')
  async removeTask(
    @Param('taskId')
    taskId: string,
  ) {
    const data = await this.tasksService.removeTask(taskId);

    return {
      statusCode: 200,

      message: 'Lưu trữ Task thành công',

      data,
    };
  }
}
