import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'modules/users/entities/user.entity';
import { HrTalentsController } from './hr-talents.controller';
import { HrTalentsService } from './hr-talents.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
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