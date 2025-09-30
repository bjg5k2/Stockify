const express = require('express');
const path = require('path');
const app = express();

app.use(express.static('.'));
app.use(express.json());

app.get('/config', (req, res) => {
  res.json({
    firebase: {
      apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBF5gzPThKD1ga_zpvtdBpiQFsexbEpZyY",
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || "stockify-75531.firebaseapp.com",
      projectId: process.env.FIREBASE_PROJECT_ID || "stockify-75531",
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "stockify-75531.firebasestorage.app",
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "831334536771",
      appId: process.env.FIREBASE_APP_ID || "1:831334536771:web:b142abcead4df128c826f6"
    },
    spotify: {
      clientId: process.env.SPOTIFY_CLIENT_ID || "b0450273fe7d41a08cc3ea93a2e733ae",
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "5b22a59a771b4f8885f887958bfddeb2"
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Stockify server running on port ${PORT}`);
});
