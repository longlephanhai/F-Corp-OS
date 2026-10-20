import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserSkillDto } from './create-user-skill.dto';

export class UpdateUserSkillDto extends PartialType(
  OmitType(CreateUserSkillDto, ['evidences'] as const),
) {}
