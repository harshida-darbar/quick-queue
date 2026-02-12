importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyC-HZjXFdylq9u5_WpW4_rlh3sADLgH-cA",
  authDomain: "quick-queue-notification-56f39.firebaseapp.com",
  projectId: "quick-queue-notification-56f39",
  storageBucket: "quick-queue-notification-56f39.firebasestorage.app",
  messagingSenderId: "261706110517",
  appId: "1:261706110517:web:c6cb6a7e8cdb83efb7037c"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/logo.png",
    badge: "/logo.png",
    requireInteraction: true
  });
});

