// TEST SCRIPT - Run this in browser console after booking an appointment
// This will manually trigger a notification to test the system

// 1. First, book an appointment normally through the UI
// 2. Then open browser console and run this:

async function testNotification() {
  const token = localStorage.getItem('token');
  const userId = JSON.parse(localStorage.getItem('quick-queue')).user._id;
  
  // Fetch user's notifications to see if they were created
  const res = await fetch('http://localhost:5000/api/notifications', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('Your notifications:', data.notifications);
  
  // Check unread count
  const countRes = await fetch('http://localhost:5000/api/notifications/unread-count', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const countData = await countRes.json();
  console.log('Unread count:', countData.count);
}

testNotification();
