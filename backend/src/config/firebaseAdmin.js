// quick-queue/backend/src/config/firebaseAdmin.js

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Check if already initialized to avoid errors
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
