import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

// The backend and frontend share the same origin in dev thanks to the Vite
// proxy for /api, but Socket.IO needs an explicit URL since it doesn't go
// through that HTTP proxy the same way.
const SOCKET_URL = 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    if (!isAuthenticated || !token) {
      setSocket(null);
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('user-online', (userId) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    });

    newSocket.on('user-offline', (userId) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated]);

  const value = {
    socket,
    onlineUsers,
    isOnline: (userId) => onlineUsers.has(userId),
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a <SocketProvider>');
  return ctx;
}
