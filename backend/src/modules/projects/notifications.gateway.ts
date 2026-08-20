import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// Bật CORS để Frontend (React) ở port khác có thể kết nối vào
@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`[Socket] Đã kết nối: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Socket] Đã ngắt kết nối: ${client.id}`);
  }

  // Hàm này dùng để các Service khác gọi vào khi muốn phát thông báo
  emitToPM(event: string, payload: any) {
    // Phát sóng sự kiện (Broadcast) tới tất cả các Client đang kết nối
    this.server.emit(event, payload);
  }
}
