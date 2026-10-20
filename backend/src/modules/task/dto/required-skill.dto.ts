import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class RequiredSkillDto {
  @IsUUID('4')
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
