
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// --------------------------------------------------------
// تنبيه هام:
// لكي يعمل التطبيق عبر الإنترنت بين أجهزة مختلفة، يجب عليك:
// 1. الذهاب إلى https://console.firebase.google.com/
// 2. إنشاء مشروع جديد
// 3. اختيار "Realtime Database" وإنشائها
// 4. نسخ إعدادات المشروع (Config) ووضعها في الأسفل
// --------------------------------------------------------

const firebaseConfig = {
  // استبدل القيم التالية ببيانات مشروعك من Firebase
  apiKey: "AIzaSyD-YOUR_API_KEY_HERE",
  authDomain: "your-project-id.firebaseapp.com",
  databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase safely
let app;
let db: any = null;
let messaging: any = null;

try {
    // Only initialize if config looks valid-ish to prevent instant crash on demo
    if (firebaseConfig.apiKey !== "AIzaSyD-YOUR_API_KEY_HERE") {
        app = initializeApp(firebaseConfig);
        db = getDatabase(app);
        messaging = getMessaging(app);
        console.log("Firebase initialized successfully");
    } else {
        console.warn("Firebase config is default. Running in LocalStorage mode.");
    }
} catch (error) {
    console.error("Firebase initialization failed:", error);
}

export { db, messaging, getToken, onMessage };
