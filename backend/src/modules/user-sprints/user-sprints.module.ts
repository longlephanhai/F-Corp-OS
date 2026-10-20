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
import { ProjectsModule } from 'modules/projects/projects.module';
import { Project } from 'modules/projects/entities/project.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { SprintAllocationInvitationService } from './sprint-allocation-invitation.service';
import { SprintAllocationResponseService } from './sprint-allocation-response.service';
import { SprintAllocationRetryService } from './sprint-allocation-retry.service';
import { WorkforceStatusService } from './workforce-status.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([UserSprint, Sprint, User, Task, Project]),
    PmRealtimeModule,
    PmAccessModule,
    ProjectsModule,
    NotificationsModule,
  ],

  controllers: [UserSprintController],

  providers: [
    UserSprintService,
    SprintAllocationInvitationService,
    SprintAllocationResponseService,
    SprintAllocationRetryService,
    WorkforceStatusService,
  ],
})
export class UserSprintsModule {}
