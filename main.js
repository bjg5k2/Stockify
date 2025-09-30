document.addEventListener('DOMContentLoaded', () => {
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
  const db = firebase.firestore();

  let currentUser = null;

  function hideAllPages() {
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  }

  window.showPage = function(pageId) {
    hideAllPages();
    const el = document.getElementById(pageId);
    if (el) el.classList.add('active');
    if (pageId === 'portfolio') loadPortfolio();
  };

  function showAppUI() {
    document.getElementById('auth-section').classList.remove('active');
    document.getElementById('navbar')?.classList.remove('hidden');
    showPage('home');
  }

  function showAuthUI() {
    document.getElementById('auth-section').classList.add('active');
    document.getElementById('navbar')?.classList.add('hidden');
    hideAllPages();
  }

  // Auth
  window.signUp = async function() {
    const email = document.querySelector('#auth-section input[type="email"]').value;
    const password = document.querySelector('#auth-section input[type="password"]').value;
    try {
      const uc = await auth.createUserWithEmailAndPassword(email, password);
      currentUser = uc.user;
      await db.collection('users').doc(currentUser.uid).set({ balance:10000, investments:{} });
      showAppUI();
      loadPortfolio();
    } catch(err){ alert(err.message || 'Sign up error'); }
  };

  window.logIn = async function() {
    const email = document.querySelector('#auth-section input[type="email"]').value;
    const password = document.querySelector('#auth-section input[type="password"]').value;
    try {
      const uc = await auth.signInWithEmailAndPassword(email, password);
      currentUser = uc.user;
      showAppUI();
      loadPortfolio();
    } catch(err){ alert(err.message || 'Login error'); }
  };

  window.logOut = async function() {
    await auth.signOut();
    currentUser = null;
    showAuthUI();
  };

  auth.onAuthStateChanged(user => {
    currentUser = user;
    if(user) showAppUI();
    else showAuthUI();
  });

  async function loadPortfolio() {
    if(!currentUser) return;
    const ref = db.collection('users').doc(currentUser.uid);
    const snap = await ref.get();
    const data = snap.exists ? snap.data() || {} : { balance:10000, investments:{} };
    if(!data.investments) data.investments={};
    if(typeof data.balance!=='number') data.balance = Number(data.balance)||10000;
    document.getElementById('balance').innerText = `Balance: ${data.balance} credits`;
    displayPortfolio(data.investments);
  }

  function displayPortfolio(investments={}) {
    const container = document.getElementById('investments');
    container.innerHTML='';
    const entries = Object.entries(investments);
    if(!entries.length){ container.innerHTML='<div class="card">No investments yet.</div>'; return; }
    entries.forEach(([artist, amt])=>{
      const d=document.createElement('div');
      d.className='investment-item card';
      d.innerHTML=`<div>${escapeHtml(artist)}</div><div><strong>${Number(amt).toLocaleString()} credits</strong></div>`;
      container.appendChild(d);
    });
  }

  // Spotify API, search, invest code (same as previous)
  // ... you can copy the full Spotify/search/invest code from prior main.js ...
  
  function escapeHtml(str){ if(typeof str!=='string') return str; return str.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
});
