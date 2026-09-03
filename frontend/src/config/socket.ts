import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:8080";

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],

  // Chỉ connect sau khi có access token
  autoConnect: false,
});

export const connectSocket = () => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return;
  }

  socket.auth = {
    token,
  };

  if (!socket.connected) {
    socket.connect();
  }
};

// Khi socket reconnect, lấy token mới nhất
socket.io.on("reconnect_attempt", () => {
  socket.auth = {
    token: localStorage.getItem("access_token"),
  };
});

socket.on("connect", () => {
  console.log(`[Socket] Connected: ${socket.id}`);
});

socket.on("connect_error", (error) => {
  console.error("[Socket] Connection error:", error.message);
});

socket.on("disconnect", () => {
  console.log("[Socket] Disconnected");
});
