import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewCycle } from './entities/review-cycle.entity';
import { ReviewRecord } from './entities/review-record.entity';
import { HrReviewsController } from './hr-reviews.controller';
import { HrReviewsService } from './hr-reviews.service';
import { RewardRuleService } from './reward-rule.service';
import { HrWalletsModule } from '../hr-wallets/hr-wallets.module';
import { PmReleaseReviewService } from './pm-release-review.service';

/**
 * HrReviewsModule — khai báo DI và import/export cho phân hệ đánh giá HR.
 * Đăng ký cả hai entities vào TypeORM để tạo bảng tương ứng.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewCycle, ReviewRecord]),
    HrWalletsModule,
  ],
  controllers: [HrReviewsController],
  providers: [HrReviewsService, RewardRuleService, PmReleaseReviewService],
  exports: [HrReviewsService, PmReleaseReviewService],
})
export class HrReviewsModule {}
