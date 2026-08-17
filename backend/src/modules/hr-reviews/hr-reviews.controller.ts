import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import type { IUser } from 'common/types/user.interface';
import { ResponseMessage, User } from 'decorator/customize';
import { GetReviewRecordsDto } from './dto/get-review-records.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';
import { HrReviewsService } from './hr-reviews.service';

/**
 * HrReviewsController — điểm nhận request cho phân hệ đánh giá HR.
 * Controller chỉ nhận request, gọi service và trả kết quả — KHÔNG chứa business logic.
 */
@Controller('hr-reviews')
export class HrReviewsController {
  constructor(private readonly hrReviewsService: HrReviewsService) {}

  /**
   * GET /api/v1/hr-reviews/records
   * Lấy danh sách bản ghi đánh giá với phân trang và bộ lọc tùy chọn.
   */
  @Get('records')
  @ResponseMessage('Get review records successfully')
  findAllRecords(@Query() query: GetReviewRecordsDto) {
    return this.hrReviewsService.findAllRecords(query);
  }

  /**
   * PATCH /api/v1/hr-reviews/records/:id/status
   * Cập nhật trạng thái (và điểm số) của một bản ghi đánh giá cụ thể.
   */
  @Patch('records/:id/status')
  @ResponseMessage('Update review status successfully')
  updateRecordStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateReviewStatusDto,
    @User() user: IUser,
  ) {
    return this.hrReviewsService.updateRecordStatus(id, updateDto, user);
  }
}
