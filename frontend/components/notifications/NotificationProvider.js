'use client';
import { useEffect } from 'react';
import { initSocket, disconnectSocket } from '@/lib/socket';

export default function NotificationProvider({ children, userId }) {
  useEffect(() => {
    console.log(' NotificationProvider mounted, userId:', userId);
    
    if (userId) {
      console.log(' Initializing socket for user:', userId);
      initSocket(userId);
    } else {
      console.log(' No userId provided, skipping socket initialization');
    }

    return () => {
      console.log(' NotificationProvider unmounting');
      disconnectSocket();
    };
  }, [userId]);

  return <>{children}</>;
}
