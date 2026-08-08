import { PartialType } from '@nestjs/swagger';
import { CreateSkillEvidenceDto } from './create-skill-evidence.dto';

export class UpdateSkillEvidenceDto extends PartialType(CreateSkillEvidenceDto) {}
