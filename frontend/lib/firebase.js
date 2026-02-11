// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-HZjXFdylq9u5_WpW4_rlh3sADLgH-cA",
  authDomain: "quick-queue-notification-56f39.firebaseapp.com",
  projectId: "quick-queue-notification-56f39",
  storageBucket: "quick-queue-notification-56f39.firebasestorage.app",
  messagingSenderId: "261706110517",
  appId: "1:261706110517:web:c6cb6a7e8cdb83efb7037c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const messaging = 
typeof window !== "undefined" ?  getMessaging(app) : null;      