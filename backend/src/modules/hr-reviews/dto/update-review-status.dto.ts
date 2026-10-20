import {
  IsEnum,
  IsNotEmpty,
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

}
