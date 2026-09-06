import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum SprintInvitationDecision {
  ACCEPT = 'ACCEPT',

  DECLINE = 'DECLINE',
}

export class RespondSprintInvitationDto {
  @IsEnum(SprintInvitationDecision)
  decision: SprintInvitationDecision;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
