import { io } from "socket.io-client";


const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:8080";

export const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: true,
    auth: (cb) => {
        cb({ token: localStorage.getItem('access_token') });
    },
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




export const reconnectSocketWithAuth = () => {
    socket.disconnect();
    socket.connect();
};

socket.on('connect', () => {
    console.log(`🟢 [Socket.io] Đã nối cáp thành công! ID: ${socket.id}`);
});

socket.on('disconnect', () => {
    console.log('🔴 [Socket.io] Mất kết nối tới Server!');
});

// Socket riêng cho namespace /chat (phòng chat theo Dự án)
export const chatSocket = io(`${SOCKET_URL}/chat`, {
    transports: ['websocket'],
    autoConnect: true,
    auth: (cb) => {
        cb({ token: localStorage.getItem('access_token') });
    },
});

export const reconnectChatSocketWithAuth = () => {
    chatSocket.disconnect();
    chatSocket.connect();
};

chatSocket.on('connect', () => {
    console.log(`🟢 [Chat Socket] Đã nối cáp thành công! ID: ${chatSocket.id}`);
});

chatSocket.on('disconnect', () => {
    console.log('🔴 [Chat Socket] Mất kết nối tới phòng chat!');
});