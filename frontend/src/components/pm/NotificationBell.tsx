import React, { useEffect, useState } from "react";
import { Badge, Popover, Typography, Button, message, Divider } from "antd";

import {
  BellOutlined,
  InfoCircleOutlined,
  CheckOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";

// Socket dùng chung toàn app
import { socket } from "../../config/socket";

// API của PM
import { pmApi } from "../../api/pm";

const { Text } = Typography;

// =========================================================
// TYPE
// =========================================================

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "info" | "success" | "warning";
  createdAt?: string;
}

// =========================================================
// HELPER
// =========================================================

const formatNotificationTime = (createdAt?: string): string => {
  if (!createdAt) {
    return "Vừa xong";
  }

  try {
    return new Date(createdAt).toLocaleString("vi-VN");
  } catch {
    return "Vừa xong";
  }
};

// =========================================================
// NOTIFICATION BELL
// =========================================================

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [loading, setLoading] = useState(false);

  // =========================================================
  // FORMAT DATA TỪ BACKEND
  // =========================================================

  const formatNotification = (item: any): Notification => {
    return {
      id: String(item.id),

      title: item.title || "Thông báo",

      description:
        item.description || item.message || "Bạn có một thông báo mới.",

      time: formatNotificationTime(item.createdAt),

      read: Boolean(item.read),

      type:
        item.type === "success" || item.type === "warning" ? item.type : "info",

      createdAt: item.createdAt,
    };
  };

  // =========================================================
  // 1. LẤY LỊCH SỬ THÔNG BÁO
  // =========================================================

  const fetchNotificationHistory = async () => {
    try {
      setLoading(true);

      const res = await pmApi.getNotificationHistory();

      const data = res?.data?.data;

      if (Array.isArray(data)) {
        const formattedData: Notification[] = data.map(formatNotification);
        setNotifications((prev) => {
          const map = new Map<string, Notification>();

          // API history
          formattedData.forEach((item) => {
            map.set(item.id, item);
          });

          // Notification realtime
          prev.forEach((item) => {
            if (!map.has(item.id)) {
              map.set(item.id, item);
            }
          });

          return Array.from(map.values()).sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;

            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

            return dateB - dateA;
          });
        });
      }
    } catch (error) {
      console.error("❌ Lỗi kéo lịch sử thông báo:", error);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // 2. SOCKET REALTIME
  // =========================================================

  useEffect(() => {
    // Load lịch sử
    fetchNotificationHistory();

    // ---------------------------------------------
    // Notification mới từ Socket
    // ---------------------------------------------

    const handleNewNotification = (data: any) => {
      console.log("🔔 Notification realtime:", data);

      const newNotification = formatNotification(data);

      // Notification realtime luôn là unread
      newNotification.read = false;

      setNotifications((prev) => {
        // Tránh duplicate nếu backend/API gửi lại
        const exists = prev.some((item) => item.id === newNotification.id);

        if (exists) {
          return prev;
        }

        return [newNotification, ...prev];
      });

      // Popup nhỏ
      message.info({
        content: `Thông báo mới: ${newNotification.title}`,
        duration: 3,
      });
    };

    // Đăng ký listener
    socket.on("new_notification", handleNewNotification);

    console.log("🔔 NotificationBell đã đăng ký Socket listener");

    // ---------------------------------------------
    // CLEANUP
    // ---------------------------------------------

    return () => {
      socket.off("new_notification", handleNewNotification);

      console.log("🔕 NotificationBell đã remove Socket listener");
    };
  }, []);

  // =========================================================
  // 3. UNREAD COUNT
  // =========================================================

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  // =========================================================
  // 4. MARK ALL AS READ
  // =========================================================

  const handleMarkAllAsRead = async () => {
    try {
      /*
       * Gọi Backend trước.
       *
       * Nếu API thành công mới update UI.
       */
      await pmApi.markAllNotificationsAsRead();

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          read: true,
        })),
      );

      message.success("Đã đánh dấu tất cả thông báo là đã đọc");
    } catch (error) {
      console.error("❌ Lỗi mark all notifications:", error);

      message.error("Lỗi khi cập nhật trạng thái thông báo");
    }
  };

  // =========================================================
  // 5. CLICK ONE NOTIFICATION
  // =========================================================

  const handleNotificationClick = async (id: string) => {
    try {
      // Gọi API cập nhật trạng thái trong database
      await pmApi.markNotificationAsRead(id);

      // Cập nhật UI sau khi API thành công
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                read: true,
              }
            : item,
        ),
      );
    } catch (error) {
      console.error("❌ Lỗi khi đánh dấu thông báo đã đọc:", error);

      message.error("Không thể cập nhật trạng thái thông báo");
    }
  };

  // =========================================================
  // 6. NOTIFICATION ICON
  // =========================================================

  const renderNotificationIcon = (type: Notification["type"]) => {
    if (type === "success") {
      return (
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircleOutlined className="text-[17px]" />
        </div>
      );
    }

    if (type === "warning") {
      return (
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
          <WarningOutlined className="text-[17px]" />
        </div>
      );
    }

    return (
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        <InfoCircleOutlined className="text-[17px]" />
      </div>
    );
  };

  // =========================================================
  // 7. POPOVER CONTENT
  // =========================================================

  const notificationContent = (
    <div className="flex w-[380px] flex-col">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <BellOutlined className="text-[17px] text-blue-600" />

          <Text
            strong
            style={{
              fontSize: "16px",
              color: "#1f2937",
            }}
          >
            Thông báo
          </Text>

          {unreadCount > 0 && (
            <span className="rounded-full bg-blue-100 px-2 py-[2px] text-[11px] font-semibold text-blue-600">
              {unreadCount} mới
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={handleMarkAllAsRead}
            loading={loading}
            style={{
              fontSize: "12px",
              padding: 0,
            }}
          >
            Đánh dấu đã đọc
          </Button>
        )}
      </div>

      <Divider style={{ margin: 0 }} />

      {/* =====================================================
          NOTIFICATION LIST
      ====================================================== */}

      <div className="max-h-[420px] overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <div className="px-8 py-12 text-center">
            <div className="mb-2 text-sm text-gray-400">
              Đang tải thông báo...
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-8 py-12 text-center">
            <BellOutlined className="mb-3 text-[30px] text-gray-300" />

            <div className="text-sm text-gray-400">Không có thông báo nào</div>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item.id)}
              className={`
                flex cursor-pointer items-start gap-3
                border-b border-gray-100
                px-4 py-4
                transition-all duration-200
                ${
                  item.read
                    ? "bg-white hover:bg-gray-50"
                    : "bg-blue-50/50 hover:bg-blue-50"
                }
              `}
            >
              {/* =================================================
                  ICON
              ================================================== */}

              <div className="mt-0.5">{renderNotificationIcon(item.type)}</div>

              {/* =================================================
                  CONTENT
              ================================================== */}

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <Text
                    strong={!item.read}
                    className={`
                      text-[14px]
                      ${item.read ? "text-gray-600" : "text-gray-900"}
                    `}
                  >
                    {item.title}
                  </Text>

                  {/* CHẤM XANH CHƯA ĐỌC */}
                  {!item.read && (
                    <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                  )}
                </div>

                {/* DESCRIPTION */}

                <div className="line-clamp-2 text-[13px] leading-relaxed text-gray-500">
                  {item.description}
                </div>

                {/* TIME */}

                <div className="mt-1.5 text-[11px] font-medium text-gray-400">
                  {item.time}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <div className="border-t border-gray-100 p-2">
        <Button
          type="text"
          block
          style={{
            color: "#1677ff",
            fontWeight: 500,
          }}
        >
          Xem tất cả thông báo
        </Button>
      </div>
    </div>
  );

  // =========================================================
  // 8. BELL
  // =========================================================

  return (
    <Popover
      content={notificationContent}
      trigger="click"
      placement="bottomRight"
      overlayInnerStyle={{
        padding: 0,
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <div
        className="
          flex
          h-11
          w-11
          cursor-pointer
          items-center
          justify-center
          rounded-full
          border
          border-gray-200
          bg-white
          shadow-sm
          transition-all
          duration-200
          hover:border-blue-300
          hover:bg-blue-50
          hover:shadow-md
        "
      >
        <Badge
          count={unreadCount}
          overflowCount={99}
          offset={[-1, 2]}
          size="small"
        >
          <BellOutlined
            className="
              text-[22px]
              text-gray-600
              transition-colors
              duration-200
              hover:text-blue-600
            "
          />
        </Badge>
      </div>
    </Popover>
  );
};
