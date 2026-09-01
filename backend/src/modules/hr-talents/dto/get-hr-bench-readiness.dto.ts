import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

import { GetHrBenchTalentsDto } from './get-hr-bench-talents.dto';

export class GetHrBenchReadinessDto
  extends GetHrBenchTalentsDto
{
  /**
   * Số ngày không có cập nhật Talent data
   * để xem profile là stale.
   *
   * Đồng bộ với Talent Data Quality.
   *
   * Default: 90 ngày.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3650)
  staleDays?: number = 90;
}