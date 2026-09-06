import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatMessage } from './entities/chat-message.entity';
import { Project } from 'modules/projects/entities/project.entity';
import { Sprint } from 'modules/sprints/entities/sprint.entity';
import { UserSprint } from 'modules/user-sprints/entities/user-sprint.entity';
import { User } from 'modules/users/entities/user.entity';
import { ChatGateway } from 'websockets/chat.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage, Project, Sprint, UserSprint, User]),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}