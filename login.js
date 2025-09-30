// login.js
let auth, db;

document.addEventListener('DOMContentLoaded', () => {
  if (!window.appConfig) return alert('App config missing!');

  try {
    firebase.initializeApp(window.appConfig.firebase);
    auth = firebase.auth();
    db = firebase.firestore();
  } catch(err) {
    console.error('Firebase init failed', err);
    alert('Failed to initialize Firebase');
  }

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  document.getElementById('login-btn').addEventListener('click', async () => {
    try {
      await auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value);
      window.location.href = 'index.html';
    } catch(err) {
      alert(err.message || 'Login failed');
    }
  });

  document.getElementById('signup-btn').addEventListener('click', async () => {
    try {
      const uc = await auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value);
      await db.collection('users').doc(uc.user.uid).set({ balance: 10000, investments: {} });
      window.location.href = 'index.html';
    } catch(err) {
      alert(err.message || 'Sign up failed');
    }
  });
});
