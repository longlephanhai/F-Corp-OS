import { Module } from '@nestjs/common';
import { UserSkillService } from './user_skill.service';
import { UserSkillController } from './user_skill.controller';
import { UserSkill } from './entities/user_skill.entity';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSkill]),
  ],
  controllers: [UserSkillController],
  providers: [UserSkillService],
})
export class UserSkillModule {}
