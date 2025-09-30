document.addEventListener('DOMContentLoaded', () => {
  // Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyBF5gzPThKD1ga_zpvtdBpiQFsexbEpZyY",
    authDomain: "stockify-75531.firebaseapp.com",
    projectId: "stockify-75531",
    storageBucket: "stockify-75531.firebasestorage.app",
    messagingSenderId: "831334536771",
    appId: "1:831334536771:web:b142abcead4df128c826f6"
  };
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();

  let currentUser = null;

  function showAuth() {
    document.getElementById('auth-section').classList.add('active');
    document.getElementById('main-header').classList.add('hidden');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  }

  function showApp() {
    document.getElementById('auth-section').classList.remove('active');
    document.getElementById('main-header').classList.remove('hidden');
    showPage('home');
  }

  window.showPage = function(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(pageId);
    if(page) page.classList.add('active');
  };

  // Login / Sign up buttons
  document.getElementById('signup-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      const uc = await auth.createUserWithEmailAndPassword(email,password);
      currentUser = uc.user;
      showApp();
    } catch(err){ alert(err.message); }
  });

  document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      const uc = await auth.signInWithEmailAndPassword(email,password);
      currentUser = uc.user;
      showApp();
    } catch(err){ alert(err.message); }
  });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await auth.signOut();
    currentUser = null;
    showAuth();
  });

  // Keep UI in sync if already signed in
  auth.onAuthStateChanged(user => {
    currentUser = user;
    if(user) showApp();
    else showAuth();
  });
});
