let auth, db;

document.addEventListener('DOMContentLoaded', () => {
  firebase.initializeApp(window.appConfig.firebase);
  auth = firebase.auth();
  db = firebase.firestore();

  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');

  loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      await auth.signInWithEmailAndPassword(email, password);
      window.location.href = 'index.html';
    } catch (err) {
      alert(err.message || 'Login error');
    }
  });

  signupBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      const uc = await auth.createUserWithEmailAndPassword(email, password);
      // initialize user doc
      await db.collection('users').doc(uc.user.uid).set({
        balance: 10000,
        investments: {}
      });
      window.location.href = 'index.html';
    } catch (err) {
      alert(err.message || 'Sign up error');
    }
  });
});
