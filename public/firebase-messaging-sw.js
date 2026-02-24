importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// --------------------------------------------------------
// تنبيه هام:
// ضع نفس إعدادات Firebase الخاصة بك هنا لكي تعمل الإشعارات في الخلفية
// --------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyD-YOUR_API_KEY_HERE",
  authDomain: "your-project-id.firebaseapp.com",
  databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    const notificationTitle = payload.notification?.title || 'إشعار جديد';
    const notificationOptions = {
      body: payload.notification?.body || 'لديك تحديث جديد في النظام',
      icon: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png',
      dir: 'rtl',
      vibrate: [200, 100, 200, 100, 200, 100, 200],
      data: payload.data,
      actions: [
        { action: 'open', title: 'فتح التطبيق' }
      ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (error) {
  console.error('Error initializing Firebase in SW:', error);
}

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        if (clientList.length > 0) {
          let client = clientList[0];
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              client = clientList[i];
            }
          }
          return client.focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});
