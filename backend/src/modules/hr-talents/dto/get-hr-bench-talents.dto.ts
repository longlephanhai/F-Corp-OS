import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  Transform,
  Type,
} from 'class-transformer';

export class GetHrBenchTalentsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  /**
   * Tìm theo tên hoặc email.
   */
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Filter theo Role master data.
   *
   * Ví dụ:
   * ?role=DEVELOPER
   */
  @IsOptional()
  @IsString()
  role?: string;

  /**
   * Skill Catalog ID thật.
   *
   * Không giới hạn UUID v4 vì
   * dữ liệu Skill hiện tại có thể
   * sử dụng UUID version khác.
   */
  @IsOptional()
  @IsUUID()
  skillId?: string;

  /**
   * Level tối thiểu.
   *
   * Có skillId:
   * → level của skill được chọn
   *   phải >= minLevel.
   *
   * Không có skillId:
   * → employee cần có ít nhất
   *   một skill đạt minLevel.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  minLevel?: number;

  /**
   * verified=true
   *
   * Có skillId:
   * → skill được chọn phải có
   *   APPROVED evidence.
   *
   * Không có skillId:
   * → employee cần có ít nhất
   *   một APPROVED evidence.
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (
      value === true ||
      value === 'true'
    ) {
      return true;
    }

    if (
      value === false ||
      value === 'false'
    ) {
      return false;
    }

    return value;
  })
  @IsBoolean()
  verified?: boolean;
}