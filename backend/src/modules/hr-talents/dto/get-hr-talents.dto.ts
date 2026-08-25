import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { UserStatusType } from 'common/enum/user.enum';

export class GetHrTalentsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  /**
   * Tìm theo tên hoặc email nhân viên.
   */
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * AVAILABLE / IN_PROJECT / BENCH
   */
  @IsOptional()
  @IsEnum(UserStatusType)
  status?: UserStatusType;

  /**
   * Filter theo tên role hiện có trong DB.
   *
   * Không hard-code enum role vì Role hiện tại
   * đang là master data trong database.
   */
  @IsOptional()
  @IsString()
  role?: string;
}