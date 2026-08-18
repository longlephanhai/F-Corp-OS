import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'modules/users/entities/user.entity';
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
    // Đăng ký User entity để HrReviewsService có thể inject UserRepository (dùng cho seed)
    TypeOrmModule.forFeature([ReviewCycle, ReviewRecord, User]),
  ],
  controllers: [HrReviewsController],
  providers: [HrReviewsService],
  exports: [HrReviewsService],
})
export class HrReviewsModule {}
