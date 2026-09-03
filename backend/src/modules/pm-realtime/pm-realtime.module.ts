import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Project } from '../projects/entities/project.entity';
import { ProjectManager } from '../projects/entities/project-manager.entity';
import { Sprint } from '../sprints/entities/sprint.entity';

import { NotificationsModule } from '../notifications/notifications.module';

import { PmRealtimeService } from './pm-realtime.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectManager, Sprint]),

    NotificationsModule,
  ],

  providers: [PmRealtimeService],

  // QUAN TRỌNG
  // Module khác muốn inject PmRealtimeService
  // thì service phải được export.
  exports: [PmRealtimeService],
})
export class PmRealtimeModule {}
