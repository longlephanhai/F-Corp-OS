import { IsEnum } from 'class-validator';

export enum SprintTargetStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class UpdateSprintStatusDto {
  @IsEnum(SprintTargetStatus, {
    message:
      'Sprint status chỉ được phép là active, completed hoặc cancelled.',
  })
  status: SprintTargetStatus;
}