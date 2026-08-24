import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ResponseMessage, SkipCheckPermission, User } from 'decorator/customize';
import type { IUser } from 'common/types/user.interface';

@Controller('chat')
@UseGuards(JwtAuthGuard)
@SkipCheckPermission()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Lấy danh sách thành viên phòng chat của 1 Dự án
  @Get('projects/:projectId/members')
  @ResponseMessage('Lấy danh sách thành viên phòng chat thành công')
  async getMembers(@Param('projectId') projectId: string, @User() user: IUser) {
    await this.assertMember(projectId, user);
    return this.chatService.getMembers(projectId);
  }

  // Lấy lịch sử tin nhắn của phòng chat 1 Dự án
  @Get('projects/:projectId/messages')
  @ResponseMessage('Lấy lịch sử tin nhắn thành công')
  async getMessages(
    @Param('projectId') projectId: string,
    @User() user: IUser,
    @Query('limit') limit?: string,
  ) {
    await this.assertMember(projectId, user);
    return this.chatService.getMessages(
      projectId,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  // Gửi tin nhắn (fallback qua REST, luồng chính vẫn là WebSocket)
  @Post('messages')
  @ResponseMessage('Gửi tin nhắn thành công')
  async createMessage(@Body() dto: CreateMessageDto, @User() user: IUser) {
    await this.assertMember(dto.projectId, user);
    return this.chatService.createMessage(dto.projectId, user.id, dto.content);
  }

  private async assertMember(projectId: string, user: IUser) {
    const isMember = await this.chatService.isProjectMember(projectId, user.id);
    if (!isMember) {
      throw new ForbiddenException(
        'Bạn không thuộc phòng chat của Dự án này',
      );
    }
  }
}