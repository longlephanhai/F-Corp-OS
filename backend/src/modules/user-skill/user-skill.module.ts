import { Module } from '@nestjs/common';
import { UserSkillService } from './user-skill.service';
import { UserSkillController } from './user-skill.controller';
import { UserSkill } from './entities/user-skill.entity';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { SkillEvidence } from 'modules/skill-evidences/entities/skill-evidence.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSkill]),
    TypeOrmModule.forFeature([SkillEvidence]),
  ],
  controllers: [UserSkillController],
  providers: [UserSkillService],
})
export class UserSkillModule { }
