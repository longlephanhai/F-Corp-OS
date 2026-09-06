import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class RetrySprintInvitationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  percentage?: number;
}
