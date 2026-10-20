import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { TaskPriority } from '../entities/task.entity';
import { RequiredSkillDto } from './required-skill.dto';

export class CreateTaskDto {
  @IsUUID('4')
  sprintId: string;

  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @IsString()
  @MaxLength(255)
  title: string;

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

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequiredSkillDto)
  requiredSkills?: RequiredSkillDto[];
}
