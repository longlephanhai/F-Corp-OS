import React, { useEffect, useMemo, useRef, useState } from "react";
import { Drawer, Input, Button, Avatar, Typography, Spin, Empty, Tooltip } from "antd";
import { SendOutlined, TeamOutlined } from "@ant-design/icons";
import { chatSocket } from "../../config/socket";
import { chatApi } from "../../api/chat";
import type { ChatMember, ChatMessage } from "../../common/types/pm";
import { useAppSelector } from "../../hooks/hooks";

const { Text } = Typography;

interface ProjectChatDrawerProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
}

// Sinh màu avatar ổn định theo id, để mỗi người 1 màu nhất quán
const AVATAR_COLORS = [
  "#1677ff",
  "#52c41a",
  "#fa8c16",
  "#eb2f96",
  "#13c2c2",
  "#722ed1",
];
const colorForId = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const formatTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

export const ProjectChatDrawer: React.FC<ProjectChatDrawerProps> = ({
  open,
  onClose,
  projectId,
  projectName,
}) => {
  const currentUser = useAppSelector((state) => state.account.user);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    });
  };

  // Tải lịch sử tin nhắn + danh sách thành viên khi mở Drawer
  useEffect(() => {
    if (!open || !projectId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [messagesRes, membersRes] = await Promise.all([
          chatApi.getMessages(projectId),
          chatApi.getMembers(projectId),
        ]);
        setMessages((messagesRes as any)?.data ?? []);
        setMembers((membersRes as any)?.data ?? []);
        scrollToBottom();
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu phòng chat:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, projectId]);

  // Join / leave room qua socket + lắng nghe tin nhắn realtime
  useEffect(() => {
    if (!open || !projectId) return;

    const doJoin = () => {
      chatSocket.emit("join-project", { projectId }, (res: any) => {
        if (res?.error) {
          console.error("Join phòng chat thất bại:", res.error);
        }
      });
    };

    if (chatSocket.connected) {
      doJoin();
    }
    chatSocket.on("connect", doJoin);

    const handleReceiveMessage = (message: ChatMessage) => {
      if (message.projectId !== projectId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      scrollToBottom();
    };

    chatSocket.on("receive-message", handleReceiveMessage);

    return () => {
      chatSocket.emit("leave-project", { projectId });
      chatSocket.off("connect", doJoin);
      chatSocket.off("receive-message", handleReceiveMessage);
    };
  }, [open, projectId]);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    chatSocket.emit(
      "send-message",
      { projectId, content: trimmed },
      (res: any) => {
        setSending(false);
        if (res?.error) {
          console.error("Gửi tin nhắn thất bại:", res.error);
          return;
        }
        setContent("");
      },
    );
  };

  const memberCountLabel = useMemo(() => {
    if (members.length === 0) return "";
    return `${members.length} thành viên`;
  }, [members]);

  return (
    <Drawer
      title={
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Text strong style={{ fontSize: 16 }}>
            💬 {projectName ? `Chat - ${projectName}` : "Chat dự án"}
          </Text>
          {memberCountLabel && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              <TeamOutlined /> {memberCountLabel}
            </Text>
          )}
        </div>
      }
      placement="right"
      width={420}
      open={open}
      onClose={onClose}
      styles={{ body: { padding: 0, display: "flex", flexDirection: "column" } }}
    >
      {/* Danh sách avatar thành viên */}
      {members.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: "10px 16px",
            borderBottom: "1px solid #f0f0f0",
            overflowX: "auto",
          }}
        >
          {members.map((m) => (
            <Tooltip key={m.id} title={m.fullName || m.email}>
              <Avatar size={28} style={{ backgroundColor: colorForId(m.id) }}>
                {(m.fullName || m.email || "?").charAt(0).toUpperCase()}
              </Avatar>
            </Tooltip>
          ))}
        </div>
      )}

      {/* Khung tin nhắn */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          background: "#fafafa",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Spin />
          </div>
        ) : messages.length === 0 ? (
          <Empty
            description="Chưa có tin nhắn nào"
            style={{ marginTop: 40 }}
          />
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender?.id === currentUser?.id;
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: isMine ? "flex-end" : "flex-start",
                  gap: 8,
                }}
              >
                {!isMine && (
                  <Avatar
                    size={30}
                    style={{ backgroundColor: colorForId(msg.sender?.id || "") }}
                  >
                    {(msg.sender?.fullName || "?").charAt(0).toUpperCase()}
                  </Avatar>
                )}
                <div style={{ maxWidth: "75%" }}>
                  {!isMine && (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {msg.sender?.fullName}
                    </Text>
                  )}
                  <div
                    style={{
                      marginTop: 2,
                      padding: "8px 12px",
                      borderRadius: 12,
                      background: isMine ? "#1677ff" : "#fff",
                      color: isMine ? "#fff" : "#000",
                      border: isMine ? "none" : "1px solid #f0f0f0",
                      wordBreak: "break-word",
                    }}
                  >
                    {msg.content}
                  </div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 10,
                      display: "block",
                      textAlign: isMine ? "right" : "left",
                      marginTop: 2,
                    }}
                  >
                    {formatTime(msg.createdAt)}
                  </Text>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Ô nhập tin nhắn */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "12px 16px",
          borderTop: "1px solid #f0f0f0",
        }}
      >
        <Input
          placeholder="Nhập tin nhắn..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onPressEnter={handleSend}
          disabled={sending}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={sending}
        />
      </div>
    </Drawer>
  );
};