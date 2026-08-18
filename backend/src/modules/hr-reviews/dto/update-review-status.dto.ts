import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { ReviewRecordStatus } from 'common/enum/hr-review.enum';

/**
 * DTO cho việc cập nhật trạng thái của một Review Record.
 */
export class UpdateReviewStatusDto {
  /** Trạng thái mới của bản ghi đánh giá — bắt buộc phải là giá trị hợp lệ trong enum */
  @IsNotEmpty({ message: 'status is required' })
  @IsEnum(ReviewRecordStatus, {
    message: `status must be one of: ${Object.values(ReviewRecordStatus).join(', ')}`,
  })
  status: ReviewRecordStatus;

  /**
   * Điểm số cuối cùng (thang 0–100). Optional vì chỉ cần điền khi trạng thái là COMPLETED.
   * Service sẽ validate logic nghiệp vụ: nếu status = COMPLETED thì finalScore nên có.
   */
  @IsOptional()
  @IsNumber({}, { message: 'finalScore must be a number' })
  @Min(0, { message: 'finalScore must be at least 0' })
  @Max(100, { message: 'finalScore must be at most 100' })
  finalScore?: number;
}
