import { io } from 'socket.io-client';

// Cấu hình URL Backend (Sau này lên Production thì bác đổi thành domain thật hoặc xài biến môi trường)
const SOCKET_URL = 'http://localhost:8080';

// Khởi tạo một bản thể (instance) DUY NHẤT cho toàn bộ hệ thống Frontend
export const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  autoConnect: true, // Tự động kết nối ngay khi app khởi động
});

// Gắn bộ lắng nghe chung để theo dõi tình trạng đường truyền ở Console
socket.on('connect', () => {
  console.log(`🟢 [Socket.io] Đã nối cáp thành công! ID: ${socket.id}`);
});

socket.on('disconnect', () => {
  console.log('🔴 [Socket.io] Mất kết nối tới Server!');
});