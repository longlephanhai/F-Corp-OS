import { Module } from '@nestjs/common';
import { SkillEvidencesService } from './skill-evidences.service';
import { SkillEvidencesController } from './skill-evidences.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillEvidence } from './entities/skill-evidence.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SkillEvidence])],
  controllers: [SkillEvidencesController],
  providers: [SkillEvidencesService],
})
export class SkillEvidencesModule { }
