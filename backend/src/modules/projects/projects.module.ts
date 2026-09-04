import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';

import { Project } from './entities/project.entity';
import { ProjectManager } from './entities/project-manager.entity';
import { User } from '../users/entities/user.entity';

import { PmRealtimeModule } from '../pm-realtime/pm-realtime.module';

import { PmAccessModule } from '../pm-access/pm-access.module';

@Module({
  imports: [
    // Entity của ProjectsService
    TypeOrmModule.forFeature([Project, ProjectManager, User]),

    // Module cung cấp PmRealtimeService
    PmRealtimeModule,

    PmAccessModule,
  ],

  controllers: [ProjectsController],

  providers: [ProjectsService],
})
export class ProjectsModule {}
