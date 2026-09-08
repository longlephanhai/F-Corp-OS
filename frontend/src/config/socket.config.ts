import { io, Socket } from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080';
const cleanBaseUrl = BASE_URL.replace(/\/+$/, '');

const sockets: Record<string, Socket> = {};

const normalizeNamespace = (namespace: string = ''): { key: string; fullUrl: string } => {
  if (!namespace || namespace === '/') {
    return { key: '/', fullUrl: cleanBaseUrl };
  }
  const formatted = namespace.startsWith('/') ? namespace : `/${namespace}`;
  return { key: formatted, fullUrl: `${cleanBaseUrl}${formatted}` };
};

const getCleanToken = (): string => {
  const token = localStorage.getItem('access_token');
  return token ? token.replace(/^Bearer\s+/i, '').trim() : '';
};

export const getSocket = (namespace: string = ''): Socket => {
  const { key, fullUrl } = normalizeNamespace(namespace);

  if (!sockets[key]) {
    const socket = io(fullUrl, {
      transports: ['websocket'],
      autoConnect: true,
      auth: (cb) => {
        cb({ token: getCleanToken() });
      },
    });

    // Event listeners debug
    socket.on('connect', () => {
      console.log(`[Socket ${key}] Connected: ${socket.id}`);
    });

    socket.on('connect_error', (error) => {
      console.error(`[Socket ${key}] Error:`, error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket ${key}] Disconnected:`, reason);
    });

    sockets[key] = socket;
  }

  return sockets[key];
};

export const connectSocket = (namespace: string = '') => {
  const { key } = normalizeNamespace(namespace);
  const socket = getSocket(key);
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};

export const disconnectSocket = (namespace?: string) => {
  if (namespace) {
    const { key } = normalizeNamespace(namespace);
    sockets[key]?.disconnect();
  } else {
    Object.values(sockets).forEach((s) => s.disconnect());
  }
};

export const reconnectSocketWithAuth = () => {
  Object.values(sockets).forEach((socket) => {
    socket.disconnect();
    socket.connect();
  });
};

// Sockets thường dùng được khởi tạo sẵn
export const socket = getSocket('/');
export const chatSocket = getSocket('/chat');