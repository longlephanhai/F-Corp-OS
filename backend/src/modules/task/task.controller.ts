import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { SkipCheckPermission } from 'decorator/customize';
import { TasksService } from './task.service';
import { UpdateTaskLifecycleDto } from './dto/update-task-lifecycle.dto';
import { UpdateTaskAssigneeDto } from './dto/update-task-assignee.dto';

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
}
