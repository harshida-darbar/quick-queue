// quick-queue/frontend/components/notifications/FirebaseToken.jsx

"use client";

import { useEffect } from "react";
import { getToken } from "firebase/messaging";
import { messaging } from "@/lib/firebase";
import { useAuth } from "@/app/context/Authcontext";

const VAPID_KEY = "BIxP2ScfKaDy3gONRqhvedx-hUv-aR9xdWvIgf3QcHo2_htyOOIpWaCHvwghtj2dJCJq-FHcd_jawM_rLxGEhmM";

export default function FirebaseToken() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      requestPermission();
    }
  }, [user]);

  const requestPermission = async () => {
    try {
      if (!messaging) {
        console.log("Messaging not supported");
        return;
      }

      // Register service worker first
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log("Service worker registered");
        await navigator.serviceWorker.ready;
      }

      console.log("Requesting notification permission...");

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        console.log("Permission denied");
        return;
      }

      console.log("Permission granted");

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      });

      if (token) {
        console.log("FCM TOKEN:", token);
        // Save token to backend
        await saveTokenToServer(token);
      } else {
        console.log("No token received");
      }
    } catch (error) {
      console.error("Error getting FCM token:", error);
    }
  };

  const saveTokenToServer = async (fcmToken) => {
    try {
      const storage = localStorage.getItem("quick-queue");
      if (!storage) return;

      const { token } = JSON.parse(storage);

      const response = await fetch("http://localhost:5000/api/users/save-fcm-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fcmToken }),
      });

      if (response.ok) {
        console.log("✅ FCM token saved to server");
      } else {
        console.log("❌ Failed to save FCM token");
      }
    } catch (error) {
      console.error("Error saving FCM token:", error);
    }
  };

  return null;
}
