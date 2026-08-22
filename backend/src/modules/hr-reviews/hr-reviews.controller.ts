import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import type { IUser } from 'common/types/user.interface';
import { Public, ResponseMessage, SkipCheckPermission, User } from 'decorator/customize';
import { CreateReviewCycleDto } from './dto/create-review-cycle.dto';
import { GetReviewRecordsDto } from './dto/get-review-records.dto';
import { UpdateReviewScoreDto } from './dto/update-review-score.dto';
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
   * POST /api/v1/hr-reviews/cycles
   * Tạo mới một Review Cycle. Lưu thông tin người tạo qua @User() decorator.
   */
  @Post('cycles')
  @ResponseMessage('Tạo kỳ đánh giá thành công')
  createCycle(
    @Body() createDto: CreateReviewCycleDto,
    @User() user: IUser,
  ) {
    return this.hrReviewsService.createCycle(createDto, user);
  }

  /**
   * POST /api/v1/hr-reviews/seed
   * [DEV ONLY] Tạo dữ liệu mẫu vào database để test UI frontend.
   * Dùng @Public() và @SkipCheckPermission() để bỏ qua JWT và phân quyền trong giai đoạn test.
   * Xóa route này trước khi deploy lên production.
   */
  @Post('seed')
  @Public()
  @SkipCheckPermission()
  @ResponseMessage('Seed dữ liệu thành công')
  seedData() {
    return this.hrReviewsService.seedData();
  }

  /**
   * GET /api/v1/hr-reviews/records/stats
   * Trả về số liệu tổng hợp (aggregate) theo từng trạng thái từ toàn bộ database.
   * PHẢI khai báo TRƯỚC route /records để NestJS không hiểu nhầm 'stats' là :id param.
   */
  @Get('records/stats')
  @ResponseMessage('Get review stats successfully')
  getRecordStats() {
    return this.hrReviewsService.getRecordStats();
  }

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

  /**
   * PATCH /api/v1/hr-reviews/records/:id/score
   * Cập nhật điểm số của một bản ghi đánh giá (tách biệt với cập nhật trạng thái).
   * PM gửi tempScore + reviewerNote; HR gửi finalScore.
   */
  @Patch('records/:id/score')
  @ResponseMessage('Update review score successfully')
  updateRecordScore(
    @Param('id') id: string,
    @Body() dto: UpdateReviewScoreDto,
    @User() user: IUser,
  ) {
    return this.hrReviewsService.updateRecordScore(id, dto, user);
  }

  /**
   * GET /api/v1/hr-reviews/records/:id
   * Lấy chi tiết một bản ghi đánh giá theo ID, bao gồm đầy đủ relations.
   * PHẢI khai báo SAU /records/stats để tránh NestJS khớp 'stats' như một :id UUID.
   */
  @Get('records/:id')
  @ResponseMessage('Get review record detail successfully')
  getRecordById(@Param('id') id: string) {
    return this.hrReviewsService.getRecordById(id);
  }
}
