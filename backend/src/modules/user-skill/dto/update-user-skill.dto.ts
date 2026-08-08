import { PartialType } from '@nestjs/swagger';
import { CreateUserSkillDto } from './create-user-skill.dto';

export class UpdateUserSkillDto extends PartialType(CreateUserSkillDto) {}
