// login.js — handles login/signup
let auth, db;

try {
  const config = window.appConfig;
  firebase.initializeApp(config.firebase);
  auth = firebase.auth();
  db = firebase.firestore();
} catch(err) {
  console.error('Failed to initialize Firebase', err);
  alert('Failed to initialize. Refresh the page.');
}

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

document.getElementById('login-btn').addEventListener('click', async () => {
  const email = emailInput.value;
  const pass = passwordInput.value;
  try {
    await auth.signInWithEmailAndPassword(email, pass);
    window.location.href = 'index.html';
  } catch(err) {
    alert(err.message || 'Login failed');
  }
});

document.getElementById('signup-btn').addEventListener('click', async () => {
  const email = emailInput.value;
  const pass = passwordInput.value;
  try {
    const uc = await auth.createUserWithEmailAndPassword(email, pass);
    // initialize user doc
    await db.collection('users').doc(uc.user.uid).set({
      balance: 10000,
      investments: {}
    });
    window.location.href = 'index.html';
  } catch(err) {
    alert(err.message || 'Sign up failed');
  }
});
