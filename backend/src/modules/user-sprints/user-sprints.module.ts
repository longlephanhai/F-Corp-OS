import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserSprintService } from './user-sprints.service';
import { UserSprintController } from './user-sprints.controller';

import { UserSprint } from './entities/user-sprint.entity';
import { Sprint } from '../sprints/entities/sprint.entity';
import { User } from '../users/entities/user.entity';
@Module({
  imports: [TypeOrmModule.forFeature([UserSprint, Sprint, User])],

  controllers: [UserSprintController],

  providers: [UserSprintService],
})
export class UserSprintsModule {}
