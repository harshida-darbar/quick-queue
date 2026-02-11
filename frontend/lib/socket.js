import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (userId) => {
  if (!socket) {
    socket = io('http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      if (userId) {
        socket.emit('join', userId);
      }
    });

    socket.on('notification', (notification) => {
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('new-notification', { 
          detail: notification 
        });
        window.dispatchEvent(event);
      }
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
