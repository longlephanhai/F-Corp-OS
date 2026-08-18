import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * DTO cho việc tạo mới một Review Cycle.
 * `startDate` và `endDate` nhận dạng ISO 8601 string (ví dụ: "2026-01-01").
 */
export class CreateReviewCycleDto {
  /** Tên chu kỳ đánh giá — bắt buộc, tối đa 255 ký tự */
  @IsNotEmpty({ message: 'name is required' })
  @IsString({ message: 'name must be a string' })
  @MaxLength(255, { message: 'name must be at most 255 characters' })
  name: string;

  /** Ngày bắt đầu chu kỳ — bắt buộc, dạng ISO date string */
  @IsNotEmpty({ message: 'startDate is required' })
  @IsDateString({}, { message: 'startDate must be a valid ISO date string' })
  startDate: string;

  /** Ngày kết thúc chu kỳ — bắt buộc, dạng ISO date string */
  @IsNotEmpty({ message: 'endDate is required' })
  @IsDateString({}, { message: 'endDate must be a valid ISO date string' })
  endDate: string;

  /** Mô tả tùy chọn cho chu kỳ đánh giá */
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @MaxLength(1000, { message: 'description must be at most 1000 characters' })
  description?: string;

  /**
   * Danh sách UUID của các nhân viên tham gia kỳ đánh giá.
   * Hệ thống sẽ tự động tạo ReviewRecord (PENDING) cho từng người.
   */
  @IsOptional()
  @IsArray({ message: 'employeeIds must be an array' })
  @IsString({ each: true, message: 'each employeeId must be a string' })
  @IsUUID('4', { each: true, message: 'each employeeId must be a valid UUID v4' })
  employeeIds?: string[];
}
