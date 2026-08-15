import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { UserSprintService } from './user-sprints.service';
import { UserSprintStatus } from './entities/user-sprint.entity';

@Controller('user-sprint')
export class UserSprintController {
  constructor(private readonly userSprintService: UserSprintService) {}

  // Tương ứng với: pmApi.getSprintUsers
  @Get('sprint/:sprintId')
  async getSprintUsers(@Param('sprintId') sprintId: string) {
    const data = await this.userSprintService.getSprintUsers(sprintId);
    return { statusCode: 200, message: 'Lấy danh sách thành công', data };
  }

  // Tương ứng với: pmApi.assignUserToSprint
  @Post()
  async assignUserToSprint(@Body() body: any) {
    const data = await this.userSprintService.assignUserToSprint(body);
    return { statusCode: 201, message: 'Đã gửi yêu cầu gán nhân sự', data };
  }

  // Tương ứng với: pmApi.updateUserSprintStatus
  @Patch(':id')
  async updateUserSprintStatus(
    @Param('id') id: string, 
    @Body('status') status: string
  ) {
    const data = await this.userSprintService.updateStatus(id, status as UserSprintStatus);
    return { statusCode: 200, message: 'Cập nhật trạng thái thành công', data };
  }
}
