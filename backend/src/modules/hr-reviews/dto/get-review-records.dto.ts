import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ReviewRecordStatus } from 'common/enum/hr-review.enum';

/**
 * DTO cho việc query danh sách Review Records với phân trang và bộ lọc.
 * Tất cả các field đều là optional — client có thể truyền một phần hoặc không truyền.
 */
export class GetReviewRecordsDto {
  /** Trang hiện tại (mặc định 1 nếu không truyền) */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page?: number;

  /** Số bản ghi mỗi trang (mặc định 10 nếu không truyền) */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  limit?: number;

  /**
   * Lọc theo department — thực tế là filter theo `role` hoặc field phòng ban của User.
   * Truyền vào dạng UUID của department/role.
   */
  @IsOptional()
  @IsString({ message: 'departmentId must be a string' })
  @IsUUID('4', { message: 'departmentId must be a valid UUID' })
  departmentId?: string;

  /** Lọc theo trạng thái của bản ghi đánh giá */
  @IsOptional()
  @IsEnum(ReviewRecordStatus, {
    message: `status must be one of: ${Object.values(ReviewRecordStatus).join(', ')}`,
  })
  status?: ReviewRecordStatus;
}
