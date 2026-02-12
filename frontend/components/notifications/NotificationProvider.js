// quick-queue/frontend/components/notifications/NotificationProvider.js

'use client';
import { useEffect } from 'react';
import { initSocket, disconnectSocket } from '@/lib/socket';

export default function NotificationProvider({ children, userId }) {
  useEffect(() => {
    if (userId) {
      initSocket(userId);
    }

    return () => {
      disconnectSocket();
    };
  }, [userId]);

  return <>{children}</>;
}
