import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:8080";

// ==========================================
// MAIN APPLICATION SOCKET
//
// Dùng cho:
// - notification
// - PM realtime
// - Sprint invitation
// ==========================================

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],

  // Không tự connect trước khi
  // access_token tồn tại.
  autoConnect: false,
});

let activeAuthToken: string | null = null;

// ==========================================
// CONNECT MAIN SOCKET
// ==========================================

export const connectSocket = () => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    console.warn("[Socket] Không connect vì chưa có access_token.");

    return;
  }

  const tokenChanged = activeAuthToken !== token;

  socket.auth = {
    token,
  };

  // Nếu socket đang connect bằng token
  // của account cũ thì reconnect để
  // backend join lại đúng user:<id>.
  if (tokenChanged && socket.connected) {
    console.log("[Socket] Token thay đổi → reconnect.");

    socket.disconnect();
  }

  activeAuthToken = token;

  if (!socket.connected) {
    socket.connect();
  }
};

// ==========================================
// RECONNECT WITH CURRENT AUTH
// ==========================================

export const reconnectSocketWithAuth = () => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return;
  }

  activeAuthToken = token;

  socket.auth = {
    token,
  };

  if (socket.connected) {
    socket.disconnect();
  }

  socket.connect();
};

// ==========================================
// SOCKET.IO AUTO RECONNECT
// ==========================================

socket.io.on("reconnect_attempt", () => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return;
  }

  activeAuthToken = token;

  socket.auth = {
    token,
  };
});

// ==========================================
// DEBUG MAIN SOCKET
// ==========================================

socket.on("connect", () => {
  console.log(`[Socket] Connected: ${socket.id}`);
});

socket.on("connect_error", (error) => {
  console.error("[Socket] Connection error:", error.message);
});

socket.on("disconnect", (reason) => {
  console.log(`[Socket] Disconnected: ${reason}`);
});

// ==========================================
// PROJECT CHAT SOCKET
//
// Namespace riêng /chat.
// Giữ độc lập với main realtime socket.
// ==========================================

export const chatSocket = io(`${SOCKET_URL}/chat`, {
  transports: ["websocket"],

  autoConnect: true,

  auth: (cb) => {
    cb({
      token: localStorage.getItem("access_token"),
    });
  },
});

export const reconnectChatSocketWithAuth = () => {
  chatSocket.disconnect();

  chatSocket.connect();
};

chatSocket.on("connect", () => {
  console.log(`[Chat Socket] Connected: ${chatSocket.id}`);
});

chatSocket.on("connect_error", (error) => {
  console.error("[Chat Socket] Connection error:", error.message);
});

chatSocket.on("disconnect", (reason) => {
  console.log(`[Chat Socket] Disconnected: ${reason}`);
});
