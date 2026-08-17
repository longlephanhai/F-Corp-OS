import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewCycle } from './entities/review-cycle.entity';
import { ReviewRecord } from './entities/review-record.entity';
import { HrReviewsController } from './hr-reviews.controller';
import { HrReviewsService } from './hr-reviews.service';

/**
 * HrReviewsModule — khai báo DI và import/export cho phân hệ đánh giá HR.
 * Đăng ký cả hai entities vào TypeORM để tạo bảng tương ứng.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewCycle, ReviewRecord]),
  ],
  controllers: [HrReviewsController],
  providers: [HrReviewsService],
  exports: [HrReviewsService],
})
export class HrReviewsModule {}
