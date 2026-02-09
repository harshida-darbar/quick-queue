import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (userId) => {
  if (!socket) {
    socket = io('http://localhost:5000', {
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      if (userId) {
        socket.emit('join', userId);
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
