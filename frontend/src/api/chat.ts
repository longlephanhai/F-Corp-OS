import axios from "../config/interceptor";
import type { ChatMember, ChatMessage } from "../common/types/pm";

export const chatApi = {
  // Lấy danh sách thành viên phòng chat của 1 Dự án
  getMembers: (projectId: string) => {
    return axios.get<IBackendRes<ChatMember[]>>(
      `/chat/projects/${projectId}/members`,
    );
  },

  // Lấy lịch sử tin nhắn của phòng chat 1 Dự án
  getMessages: (projectId: string, limit = 100) => {
    return axios.get<IBackendRes<ChatMessage[]>>(
      `/chat/projects/${projectId}/messages`,
      { params: { limit } },
    );
  },

  // Gửi tin nhắn qua REST (dự phòng, luồng chính là qua WebSocket)
  sendMessage: (projectId: string, content: string) => {
    return axios.post<IBackendRes<ChatMessage>>("/chat/messages", {
      projectId,
      content,
    });
  },
};