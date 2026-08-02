import { PartialType } from '@nestjs/swagger';
import { CreateUserSkillDto } from './create-user_skill.dto';

export class UpdateUserSkillDto extends PartialType(CreateUserSkillDto) {}
