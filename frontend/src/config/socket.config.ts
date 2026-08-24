import { io, Socket } from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_SOCKET_URL;
const sockets: Record<string, Socket> = {};


export const getSocket = (namespace: string): Socket => {

  const fullUrl = `${BASE_URL}${namespace}`;


  if (!sockets[namespace]) {
    const socket = io(fullUrl, {
      transports: ['websocket'],
      autoConnect: false,
    });


    socket.io.on('reconnect_attempt', () => {
      const token = localStorage.getItem('access_token');
      const rawToken = token ? token.replace(/^Bearer\s+/i, '') : '';
      socket.auth = { token: `Bearer ${rawToken}` };
    });

    // Event listeners debug
    socket.on('connect', () => {
      console.log(`[Socket ${namespace}] Connected: ${socket.id}`);
    });

    socket.on('connect_error', (error) => {
      console.error(`[Socket ${namespace}] Error:`, error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket ${namespace}] Disconnected:`, reason);
    });

    sockets[namespace] = socket;
  }

  return sockets[namespace];
};


export const connectSocket = (namespace: string) => {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  const rawToken = token.replace(/^Bearer\s+/i, '');
  const socket = getSocket(namespace);

  socket.auth = {
    token: `Bearer ${rawToken}`,
  };

  if (!socket.connected) {
    socket.connect();
  }
};


export const disconnectSocket = (namespace?: string) => {
  if (namespace) {
    const formattedNamespace = namespace.startsWith('/') ? namespace : `/${namespace}`;
    sockets[formattedNamespace]?.disconnect();
  } else {
    Object.values(sockets).forEach((s) => s.disconnect());
  }
};