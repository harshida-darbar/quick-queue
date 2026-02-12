// Test FCM Push Notification
// Run this with: node test-fcm.js

require('dotenv').config();
const admin = require('./src/config/firebaseAdmin');

// Replace with a real FCM token from your browser console
const TEST_FCM_TOKEN = 'faXbwN4-9XOc2qREL7V4JL:APA91bFzkk0-2hAej0J7CClZx7CRmDtilAyzPRMpjWSjwY1-EMsVfFOA6h-DNJr7uBVhfvCWUbwI2zQ_2KQcnLgDBo95RfX1BBzSiNh2_2J0hJXxneMHOAI';

async function testFCM() {
  try {
    console.log('🧪 Testing FCM push notification...');
    console.log('📱 Token:', TEST_FCM_TOKEN.substring(0, 20) + '...');
    
    const result = await admin.messaging().send({
      token: TEST_FCM_TOKEN,
      notification: {
        title: 'Test Notification',
        body: 'This is a test FCM push notification!',
      },
      webpush: {
        fcmOptions: {
          link: 'http://localhost:3000/user/appointments'
        },
        notification: {
          icon: '/logo.png',
          badge: '/logo.png',
          requireInteraction: true,
        }
      }
    });
    
    console.log('✅ FCM notification sent successfully!');
    console.log('📤 Message ID:', result);
    process.exit(0);
  } catch (error) {
    console.error('❌ FCM Error:');
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    if (error.code === 'app/invalid-credential') {
      console.error('\n⚠️  This error means:');
      console.error('   1. Your system time is not synced with internet time');
      console.error('   2. OR your service account key is invalid/revoked');
      console.error('\n💡 Solution:');
      console.error('   - Windows: Settings → Time & Language → Sync now');
      console.error('   - Or generate a new service account key from Firebase Console');
    }
    process.exit(1);
  }
}

testFCM();
