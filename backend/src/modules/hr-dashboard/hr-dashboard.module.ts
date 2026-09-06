import { Module } from '@nestjs/common';

import { HrReviewsModule } from '../hr-reviews/hr-reviews.module';
import { HrTalentsModule } from '../hr-talents/hr-talents.module';
import { HrWalletsModule } from '../hr-wallets/hr-wallets.module';

import { HrDashboardController } from './hr-dashboard.controller';
import { HrDashboardService } from './hr-dashboard.service';

@Module({
  imports: [
    HrTalentsModule,
    HrReviewsModule,
    HrWalletsModule,
  ],

  controllers: [
    HrDashboardController,
  ],

  providers: [
    HrDashboardService,
  ],
})
export class HrDashboardModule {}