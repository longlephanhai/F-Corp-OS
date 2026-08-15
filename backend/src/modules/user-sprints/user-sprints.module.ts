import { Module } from '@nestjs/common';
import { UserSprintService } from './user-sprints.service';
import { UserSprintController } from './user-sprints.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSprint } from './entities/user-sprint.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserSprint])],
  controllers: [UserSprintController],
  providers: [UserSprintService],
})
export class UserSprintsModule {}
