import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserSprintService } from './user-sprints.service';
import { UserSprintController } from './user-sprints.controller';

import { UserSprint } from './entities/user-sprint.entity';
import { Sprint } from '../sprints/entities/sprint.entity';
import { User } from '../users/entities/user.entity';
import { Task } from '../task/entities/task.entity';
import { PmRealtimeModule } from '../pm-realtime/pm-realtime.module';
import { PmAccessModule } from '../pm-access/pm-access.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SprintAllocationInvitationService } from './sprint-allocation-invitation.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([UserSprint, Sprint, User, Task]),
    PmRealtimeModule,
    PmAccessModule,
    NotificationsModule,
  ],

  controllers: [UserSprintController],

  providers: [UserSprintService, SprintAllocationInvitationService],
})
export class UserSprintsModule {}
