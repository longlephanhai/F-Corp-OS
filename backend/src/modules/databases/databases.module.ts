import { Module } from '@nestjs/common';
import { DatabasesService } from './databases.service';
import { DatabasesController } from './databases.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'modules/roles/entities/role.entity';
import { Permission } from 'modules/permissions/entities/permission.entity';
import { User } from 'modules/users/entities/user.entity';
import { UsersService } from 'modules/users/users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Role]),
    TypeOrmModule.forFeature([Permission]),
  ],
  controllers: [DatabasesController],
  providers: [DatabasesService, UsersService],
})
export class DatabasesModule { }
