import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { SkipCheckPermission } from 'decorator/customize';
import { TasksService } from './task.service';

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
}
