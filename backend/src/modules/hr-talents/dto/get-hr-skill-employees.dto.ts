import {
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { UserStatusType } from 'common/enum/user.enum';

export class GetHrSkillEmployeesDto {
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
   * Cho phép HR lọc supply của skill theo trạng thái workforce.
   *
   * AVAILABLE / IN_PROJECT / BENCH
   */
  @IsOptional()
  @IsEnum(UserStatusType)
  status?: UserStatusType;
}