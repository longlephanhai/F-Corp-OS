import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'modules/users/entities/user.entity';
import { HrTalentsController } from './hr-talents.controller';
import { HrTalentsService } from './hr-talents.service';
import { ReviewRecord } from 'modules/hr-reviews/entities/review-record.entity';
import { Skill } from 'modules/skills/entities/skill.entity';
import { HrTalentDirectoryService } from './services/hr-talent-directory.service';
import { HrTalentProfileService } from './services/hr-talent-profile.service';
import { HrSkillMatrixService } from './services/hr-skill-matrix.service';
import { UserSkill } from 'modules/user-skill/entities/user-skill.entity';
import { HrSkillSupplyInsightService } from './services/hr-skill-supply-insight.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ReviewRecord,
      Skill,
      UserSkill,
    ]),
  ],

  controllers: [
    HrTalentsController,
  ],

  providers: [
    HrTalentsService,
    HrTalentDirectoryService,
    HrTalentProfileService,
    HrSkillMatrixService,
    HrSkillSupplyInsightService,
  ],

  exports: [
    HrTalentsService,
  ],
})
export class HrTalentsModule { }