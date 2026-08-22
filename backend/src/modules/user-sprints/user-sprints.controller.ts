import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { SkipCheckPermission } from 'decorator/customize';
import { UserSprintService } from './user-sprints.service';
import { UserSprintStatus } from './entities/user-sprint.entity';

@SkipCheckPermission()
@Controller('user-sprint')
export class UserSprintController {
  constructor(private readonly userSprintService: UserSprintService) {}

  // Tương ứng với: pmApi.getSprintUsers
  @Get('sprint/:sprintId')
  async getSprintUsers(@Param('sprintId') sprintId: string) {
    const data = await this.userSprintService.getSprintUsers(sprintId);
    return { statusCode: 200, message: 'Lấy danh sách thành công', data };
  }
  @Get('capacity/:userId')
  async getUserCapacity(
    @Param('userId') userId: string,
    @Query('sprintId') sprintId: string,
  ) {
    const data = await this.userSprintService.getUserCapacity(userId, sprintId);

    return {
      statusCode: 200,
      message: 'Lấy capacity nhân sự thành công',
      data,
    };
  }
  // Tương ứng với: pmApi.assignUserToSprint

  @Post()
  async assignUserToSprint(@Body() body: any) {
    const data = await this.userSprintService.assignUserToSprint(body);
    return { statusCode: 201, message: 'Đã gửi yêu cầu gán nhân sự', data };
  }

  @Patch(':id/submit-approval')
  async submitForApproval(@Param('id') id: string) {
    const data = await this.userSprintService.submitForApproval(id);

    return {
      statusCode: 200,
      message: 'Đã gửi yêu cầu phân bổ để phê duyệt',
      data,
    };
  }

  @Delete(':id/request')
  async cancelRequest(@Param('id') id: string) {
    const data = await this.userSprintService.cancelRequest(id);

    return {
      statusCode: 200,
      message: 'Đã hủy yêu cầu phân bổ',
      data,
    };
  }

  // Tương ứng với: pmApi.updateUserSprintStatus
  @Patch(':id')
  async updateUserSprintStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    const data = await this.userSprintService.updateStatus(
      id,
      status as UserSprintStatus,
    );
    return { statusCode: 200, message: 'Cập nhật trạng thái thành công', data };
  }
  @Patch(':id/release')
  async releaseUser(@Param('id') id: string, @Body() body: any) {
    const data = await this.userSprintService.releaseUser(id, body);
    return {
      statusCode: 200,
      message: 'Giải phóng và đánh giá nhân sự thành công',
      data,
    };
  }
}
