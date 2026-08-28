import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import { TaskPriority } from '../entities/task.entity';

class UpdateRequiredSkillDto {
  @IsString()
  skill_id: string;

  @IsInt()
  @Min(1)
  @Max(5)
  min_level: number;

  @IsInt()
  @Min(1)
  @Max(10)
  weight: number;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetRate?: number | null;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({
    each: true,
  })
  @Type(() => UpdateRequiredSkillDto)
  requiredSkills?: UpdateRequiredSkillDto[];
}
