import { io } from 'socket.io-client';
import { getToken } from './api';

// Socket.IO connects to the server's own origin, not the REST "/api" path —
// derive it from the same env var api.js uses so there's only one place
// that knows the backend's address.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '');

let socket = null;

// Lazily creates a single shared, authenticated socket connection. Reused
// across every page that needs live updates instead of one socket per
// component — matches server/src/sockets/index.js, which authenticates the
// handshake with the same JWT the REST API uses.
export function getSocket() {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    autoConnect: false,
    auth: (cb) => cb({ token: `Bearer ${getToken() || ''}` }),
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
