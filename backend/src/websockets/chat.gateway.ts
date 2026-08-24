import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from 'modules/chat/chat.service';

interface JoinProjectPayload {
  projectId: string;
}

interface SendMessagePayload {
  projectId: string;
  content: string;
}

const projectRoom = (projectId: string) => `project:${projectId}`;

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleDisconnect(client: Socket) {
    // socket.io tự động rời khỏi mọi room khi disconnect, không cần xử lý thêm
  }

  // Client tham gia phòng chat của 1 Dự án (chỉ khi thực sự là thành viên Dự án đó)
  @SubscribeMessage('join-project')
  async handleJoinProject(
    @MessageBody() data: JoinProjectPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    if (!user) {
      return { error: 'Bạn chưa đăng nhập' };
    }

    const isMember = await this.chatService.isProjectMember(
      data.projectId,
      user.id,
    );
    if (!isMember) {
      return { error: 'Bạn không thuộc phòng chat của Dự án này' };
    }

    await client.join(projectRoom(data.projectId));

    // Báo cho các thành viên khác trong phòng biết có người vừa online
    client.to(projectRoom(data.projectId)).emit('member-online', {
      userId: user.id,
      fullName: user.fullName,
    });

    return { success: true };
  }

  // Client rời phòng chat của 1 Dự án (ví dụ khi đóng khung chat)
  @SubscribeMessage('leave-project')
  async handleLeaveProject(
    @MessageBody() data: JoinProjectPayload,
    @ConnectedSocket() client: Socket,
  ) {
    await client.leave(projectRoom(data.projectId));
    return { success: true };
  }

  // Gửi tin nhắn vào phòng chat của 1 Dự án
  @SubscribeMessage('send-message')
  async handleSendMessage(
    @MessageBody() data: SendMessagePayload,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    if (!user) {
      return { error: 'Bạn chưa đăng nhập' };
    }

    const content = (data?.content || '').trim();
    if (!content) {
      return { error: 'Nội dung tin nhắn không được để trống' };
    }

    const isMember = await this.chatService.isProjectMember(
      data.projectId,
      user.id,
    );
    if (!isMember) {
      return { error: 'Bạn không thuộc phòng chat của Dự án này' };
    }

    const message = await this.chatService.createMessage(
      data.projectId,
      user.id,
      content,
    );

    // Phát tin nhắn tới toàn bộ thành viên đang trong phòng (kể cả người gửi)
    this.server.to(projectRoom(data.projectId)).emit('receive-message', message);

    return { success: true, data: message };
  }
}