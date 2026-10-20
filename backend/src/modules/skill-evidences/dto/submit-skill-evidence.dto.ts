import { IsUUID } from 'class-validator';
import { CreateSkillEvidenceDto } from './create-skill-evidence.dto';

export class SubmitSkillEvidenceDto extends CreateSkillEvidenceDto {
  @IsUUID('4')
  userSkillId: string;
}
