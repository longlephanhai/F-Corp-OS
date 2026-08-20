import React, { useState, useEffect } from 'react';
import { Badge, Popover, Typography, Button, message } from 'antd';
import { 
    BellOutlined, 
    InfoCircleOutlined, 
    CheckOutlined, 
    CheckCircleOutlined 
} from '@ant-design/icons';
// BÙM 💥: Import thư viện Socket
import { io } from 'socket.io-client';

const { Text } = Typography;

// Mock data tạm thời (Chờ nối Socket thật)
const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Bằng chứng mới chờ duyệt',
    description: 'Dev Lê Văn Lính vừa nộp chứng chỉ AWS Certified Solutions Architect. Vui lòng vào My Team kiểm tra!',
    time: 'Vừa xong',
    read: false,
    type: 'info'
  },
  {
    id: '2',
    title: 'Dự án Alpha Cloud',
    description: 'Sprint 2 đã chính thức bắt đầu.',
    time: '2 giờ trước',
    read: false,
    type: 'success'
  },
  {
    id: '3',
    title: 'Cảnh báo nhân sự',
    description: 'Trần Thị B đang bị quá tải công việc trong tuần này.',
    time: '1 ngày trước',
    read: true,
    type: 'warning'
  }
];

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>(MOCK_NOTIFICATIONS);

  // =========================================================
  // LOGIC KẾT NỐI SOCKET.IO (REAL-TIME)
  // =========================================================
  useEffect(() => {
    // 1. Khởi tạo kết nối tới Backend (Nhớ đổi port 3000 nếu BE của bác chạy port khác)
    const socket = io('http://localhost:3000', {
      transports: ['websocket'], // Ép dùng websocket để đỡ bị lỗi CORS polling
    });

    socket.on('connect', () => {
      console.log('🔌 Đã kết nối Socket thành công tới Backend!');
    });

    // 2. Lắng nghe sự kiện 'new_notification' (Đúng y xì cái tên anh em mình khai báo ở Gateway)
    socket.on('new_notification', (data) => {
      console.log('🔔 Chuông reo, có biến:', data);
      
      // Bơm thông báo mới lên trên cùng của danh sách
      setNotifications((prev) => [data, ...prev]);
      
      // Hiển thị thêm cái popup nhỏ trượt ra ở góc màn hình cho ngầu
      message.info(`Thông báo mới: ${data.title}`);
    });

    // Cleanup khi component bị hủy
    return () => {
      socket.disconnect();
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  // =========================================================================
  // GIAO DIỆN BÊN TRONG BẢNG THÔNG BÁO (POP-OVER CONTENT)
  // =========================================================================
  const notificationContent = (
    <div className="w-[360px] flex flex-col">
      {/* HEADER */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <Text strong style={{ fontSize: '16px', color: '#1f2937' }}>Thông báo</Text>
        {unreadCount > 0 && (
          <Button 
            type="link" 
            size="small" 
            icon={<CheckOutlined />}
            onClick={handleMarkAllAsRead}
            style={{ fontSize: '12px', padding: 0 }}
          >
            Đánh dấu đã đọc
          </Button>
        )}
      </div>

      {/* DANH SÁCH THÔNG BÁO */}
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Không có thông báo nào
          </div>
        ) : (
          notifications.map((item) => (
            <div 
              key={item.id} 
              className={`flex items-start gap-3 p-4 border-b border-gray-50 cursor-pointer transition-colors duration-200 
                ${item.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/30 hover:bg-blue-50/50'}`}
            >
              {/* ICON BÊN TRÁI */}
              <div className="flex-shrink-0 mt-1">
                {item.type === 'success' ? (
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <CheckCircleOutlined />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <InfoCircleOutlined />
                  </div>
                )}
              </div>

              {/* NỘI DUNG Ở GIỮA */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <Text 
                    strong={!item.read} 
                    className={`text-[14px] truncate pr-2 ${item.read ? 'text-gray-600' : 'text-gray-900'}`}
                  >
                    {item.title}
                  </Text>
                  
                  {/* CHẤM XANH BÁO CHƯA ĐỌC LÊN GÓC PHẢI */}
                  {!item.read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  )}
                </div>
                
                {/* MÔ TẢ (LINE-CLAMP ĐỂ KHÔNG BỊ TRÀN) */}
                <div className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed">
                  {item.description}
                </div>
                
                <div className="text-[11px] text-gray-400 mt-1.5 font-medium">
                  {item.time}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FOOTER */}
      <div className="p-2 border-t border-gray-100 text-center">
        <Button type="text" block style={{ color: '#1677ff' }}>
          Xem tất cả thông báo
        </Button>
      </div>
    </div>
  );

  return (
    <Popover 
      content={notificationContent} 
      trigger="click" 
      placement="bottomRight"
      // Xóa padding mặc định của Antd để Custom Tailwind tràn viền cho đẹp
      overlayInnerStyle={{ padding: 0, borderRadius: '8px', overflow: 'hidden' }}
    >
      <Badge count={unreadCount} overflowCount={99} offset={[-4, 4]} className="cursor-pointer">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
          <BellOutlined className="text-[18px] text-gray-600" />
        </div>
      </Badge>
    </Popover>
  );
};