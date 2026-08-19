import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * DTO cho endpoint PATCH /records/:id/score.
 * PM nhập tempScore và reviewerNote; HR nhập finalScore.
 * Tất cả các field đều optional để hỗ trợ partial update.
 */
export class UpdateReviewScoreDto {
  /**
   * Điểm sơ bộ do PM chấm (thang 0–100).
   * Chỉ PM mới nên gửi field này.
   */
  @IsOptional()
  @IsNumber({}, { message: 'tempScore phải là số' })
  @Min(0, { message: 'tempScore không được nhỏ hơn 0' })
  @Max(100, { message: 'tempScore không được lớn hơn 100' })
  tempScore?: number;

  /**
   * Điểm chốt cuối cùng do HR xác nhận (thang 0–100).
   * Bắt buộc phải có trước khi chuyển sang trạng thái COMPLETED.
   */
  @IsOptional()
  @IsNumber({}, { message: 'finalScore phải là số' })
  @Min(0, { message: 'finalScore không được nhỏ hơn 0' })
  @Max(100, { message: 'finalScore không được lớn hơn 100' })
  finalScore?: number;

  /**
   * Ghi chú/nhận xét của người đánh giá (PM).
   */
  @IsOptional()
  @IsString({ message: 'reviewerNote phải là chuỗi ký tự' })
  reviewerNote?: string;
}
