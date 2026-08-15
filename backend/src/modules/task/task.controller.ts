import { Controller, Post, Body } from '@nestjs/common';
import { TasksService } from './task.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // Tương ứng với: pmApi.createTask
  @Post()
  async createTask(@Body() body: any) {
    const data = await this.tasksService.createTask(body);
    return { statusCode: 201, message: 'Tạo Task mới thành công', data };
  }
}
