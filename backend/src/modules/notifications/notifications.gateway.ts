import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;

      if (!token) {
        console.log(`[Socket] Reject client chưa đăng nhập: ${client.id}`);
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync<{
        id: string;
        email: string;
      }>(token);

      client.data.userId = payload.id;

      // Mỗi user vào room riêng
      await client.join(`user:${payload.id}`);

      console.log(`[Socket] Connected ${client.id} → user:${payload.id}`);
    } catch (error) {
      console.log(`[Socket] Token không hợp lệ: ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`[Socket] Disconnected: ${client.id}`);
  }

  // ==========================================
  // GENERIC USER EVENT
  // ==========================================

  emitEventToUser(userId: string, eventName: string, payload: unknown) {
    if (!this.server) {
      return;
    }

    this.server.to(`user:${userId}`).emit(eventName, payload);
  }

  // ==========================================
  // NOTIFICATION
  //
  // Giữ backward compatibility.
  // NotificationBell vẫn nghe new_notification.
  // ==========================================

  emitToUser(userId: string, payload: unknown) {
    this.emitEventToUser(userId, 'new_notification', payload);
  }
}
