import { Injectable } from '@nestjs/common';

@Injectable()
export class RewardRuleService {
  /**
   * Tính toán phần thưởng F-Token dựa trên điểm số đánh giá.
   * Quy tắc:
   * - >= 90: 1000 F-Token
   * - >= 80: 500 F-Token
   * - >= 70: 200 F-Token
   * - Khác: 0 F-Token
   */
  calculateScoreReward(score: number): number {
    if (score >= 90) return 1000;
    if (score >= 80) return 500;
    if (score >= 70) return 200;
    return 0;
  }
}
