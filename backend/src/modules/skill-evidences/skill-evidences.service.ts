import { Injectable } from '@nestjs/common';
import { CreateSkillEvidenceDto } from './dto/create-skill-evidence.dto';
import { UpdateSkillEvidenceDto } from './dto/update-skill-evidence.dto';

@Injectable()
export class SkillEvidencesService {
  create(createSkillEvidenceDto: CreateSkillEvidenceDto) {
    return 'This action adds a new skillEvidence';
  }

  findAll() {
    return `This action returns all skillEvidences`;
  }

  findOne(id: number) {
    return `This action returns a #${id} skillEvidence`;
  }

  update(id: number, updateSkillEvidenceDto: UpdateSkillEvidenceDto) {
    return `This action updates a #${id} skillEvidence`;
  }

  remove(id: number) {
    return `This action removes a #${id} skillEvidence`;
  }
}
