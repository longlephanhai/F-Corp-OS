import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SkillEvidencesService } from './skill-evidences.service';
import { SkillEvidencesController } from './skill-evidences.controller';

import { SkillEvidence } from './entities/skill-evidence.entity';
import { UserSkill } from 'modules/user-skill/entities/user-skill.entity';

import { NotificationsModule } from '../notifications/notifications.module';
import { UserSkillModule } from 'modules/user-skill/user-skill.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SkillEvidence, UserSkill]),

    NotificationsModule,
    UserSkillModule,
  ],

  controllers: [SkillEvidencesController],

  providers: [SkillEvidencesService],
})
export class SkillEvidencesModule {}
