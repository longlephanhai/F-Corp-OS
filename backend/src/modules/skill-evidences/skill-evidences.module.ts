import { Module } from '@nestjs/common';
import { SkillEvidencesService } from './skill-evidences.service';
import { SkillEvidencesController } from './skill-evidences.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillEvidence } from './entities/skill-evidence.entity';
import { UserSkill } from 'modules/user-skill/entities/user-skill.entity';
import { NotificationsGateway } from 'modules/projects/notifications.gateway';
import { Notification } from '../notifications/entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SkillEvidence, UserSkill, Notification])],
  controllers: [SkillEvidencesController],
  providers: [SkillEvidencesService, NotificationsGateway],
})
export class SkillEvidencesModule {}
