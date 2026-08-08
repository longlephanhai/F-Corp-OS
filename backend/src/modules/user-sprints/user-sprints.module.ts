import { Module } from '@nestjs/common';
import { UserSprintsService } from './user-sprints.service';
import { UserSprintsController } from './user-sprints.controller';

@Module({
  controllers: [UserSprintsController],
  providers: [UserSprintsService],
})
export class UserSprintsModule {}
