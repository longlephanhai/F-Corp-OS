import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import {
  HrSkillSupplyRiskLevel,
} from '../services/skill-supply/risk/hr-skill-supply-risk.types';

export class GetHrSkillSupplyRiskDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(HrSkillSupplyRiskLevel)
  riskLevel?: HrSkillSupplyRiskLevel;
}