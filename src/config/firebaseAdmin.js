const { initializeApp, getApps } = require("firebase-admin/app");
const { cert } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const { getDatabase } = require("firebase-admin/database");

if (!getApps().length) {
  try {
    let serviceAccount;

    try {
      serviceAccount = require("./service-account.json");
    } catch {
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      };
    }

    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });

    console.log("Firebase Admin initialized");
  } catch (error) {
    console.error("Firebase Admin init error:", error.message);
  }
}

module.exports = {
  messaging: () => getMessaging(),
  database: () => getDatabase(),
};
