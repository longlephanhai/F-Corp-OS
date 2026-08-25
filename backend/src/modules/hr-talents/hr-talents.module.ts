import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'modules/users/entities/user.entity';
import { HrTalentsController } from './hr-talents.controller';
import { HrTalentsService } from './hr-talents.service';
import { ReviewRecord } from 'modules/hr-reviews/entities/review-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ReviewRecord,
    ]),
  ],

  controllers: [
    HrTalentsController,
  ],

  providers: [
    HrTalentsService,
  ],

  exports: [
    HrTalentsService,
  ],
})
export class HrTalentsModule {}