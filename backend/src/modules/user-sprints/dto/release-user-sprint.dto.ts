import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ReleaseUserSprintDto {
  @Type(() => Number)
  @IsInt({ message: 'hardSkillRate phải là số nguyên' })
  @Min(1, { message: 'hardSkillRate phải từ 1 đến 5' })
  @Max(5, { message: 'hardSkillRate phải từ 1 đến 5' })
  hardSkillRate: number;

  @Type(() => Number)
  @IsInt({ message: 'softSkillRate phải là số nguyên' })
  @Min(1, { message: 'softSkillRate phải từ 1 đến 5' })
  @Max(5, { message: 'softSkillRate phải từ 1 đến 5' })
  softSkillRate: number;

  @IsString({ message: 'reviewComment phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'reviewComment là bắt buộc' })
  @MaxLength(500, { message: 'reviewComment không được vượt quá 500 ký tự' })
  reviewComment: string;
}
