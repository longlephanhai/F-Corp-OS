import { Module } from '@nestjs/common';
import { UserSkillService } from './user-skill.service';
import { UserSkillController } from './user-skill.controller';
import { UserSkill } from './entities/user-skill.entity';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSkill]),
  ],
  controllers: [UserSkillController],
  providers: [UserSkillService],
})
export class UserSkillModule {}
