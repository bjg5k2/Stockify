document.addEventListener('DOMContentLoaded', () => {
  // ---------- Firebase (compat) ----------
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

  // ---------- UI helpers ----------
  function hideAllPages() {
    document.querySelectorAll('.page').forEach(el => {
      el.classList.add('hidden');
      el.classList.remove('active');
    });
  }

  window.showPage = function(pageId) {
    hideAllPages();
    const el = document.getElementById(pageId);
    if (el) {
      el.classList.remove('hidden');
      el.classList.add('active');
      if (pageId === 'portfolio') loadPortfolio();
    }
  };

  function showAppUI() {
    const authSection = document.getElementById('auth-section');
    if (authSection) authSection.classList.add('hidden');
    const navbar = document.getElementById('navbar');
    if (navbar) navbar.classList.remove('hidden');
    showPage('home');
  }

  function showAuthUI() {
    const authSection = document.getElementById('auth-section');
    if (authSection) authSection.classList.remove('hidden');
    const navbar = document.getElementById('navbar');
    if (navbar) navbar.classList.add('hidden');
    hideAllPages();
  }

  // ---------- Globals ----------
  let currentUser = null;

  // ---------- Auth ----------
  window.signUp = async function() {
    const email = document.querySelector('#auth-section input[type="email"]').value;
    const password = document.querySelector('#auth-section input[type="password"]').value;
    try {
      const uc = await auth.createUserWithEmailAndPassword(email, password);
      currentUser = uc.user;
      await db.collection('users').doc(currentUser.uid).set({
        balance: 10000,
        investments: {}
      });
      showAppUI();
      loadPortfolio();
    } catch (err) { alert(err.message || 'Sign up error'); }
  };

  window.logIn = async function() {
    const email = document.querySelector('#auth-section input[type="email"]').value;
    const password = document.querySelector('#auth-section input[type="password"]').value;
    try {
      const uc = await auth.signInWithEmailAndPassword(email, password);
      currentUser = uc.user;
      showAppUI();
      loadPortfolio();
    } catch (err) { alert(err.message || 'Login error'); }
  };

  window.logOut = async function() {
    await auth.signOut();
    currentUser = null;
    showAuthUI();
  };

  // ---------- FIX: prevent flash ----------
  auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
      showAppUI();
      loadPortfolio();
    } else {
      showAuthUI();
    }
  });

  // ---------- Portfolio ----------
  async function loadPortfolio() {
    if (!currentUser) return;
    try {
      const ref = db.collection('users').doc(currentUser.uid);
      const snap = await ref.get();
      let data = snap.exists ? (snap.data() || {}) : { balance: 10000, investments: {} };
      if (!data.investments) data.investments = {};
      if (typeof data.balance !== 'number') data.balance = Number(data.balance) || 10000;

      document.getElementById('balance').innerText = `Balance: ${data.balance} credits`;
      displayPortfolio(data.investments);
    } catch (err) { console.error('loadPortfolio error', err); }
  }

  function displayPortfolio(investments = {}) {
    const container = document.getElementById('investments');
    if (!container) return;
    container.innerHTML = '';
    const entries = Object.entries(investments);
    if (entries.length === 0) {
      container.innerHTML = `<div class="card">No investments yet.</div>`;
      return;
    }
    entries.forEach(([artistId, inv]) => {
      const d = document.createElement('div');
      d.className = 'investment-item card';
      const roi = inv.followersAtPurchase ? ((inv.currentFollowers || inv.followersAtPurchase)/inv.followersAtPurchase).toFixed(2) : 1;
      d.innerHTML = `
        <div>${escapeHtml(inv.artistName)}</div>
        <div>
          <strong>${Number(inv.amount).toLocaleString()} credits</strong> 
          (ROI: ${roi}x)
        </div>`;
      container.appendChild(d);
    });
  }

  // ---------- Spotify ----------
  const SPOTIFY_CLIENT_ID = "b0450273fe7d41a08cc3ea93a2e733ae";
  const SPOTIFY_CLIENT_SECRET = "5b22a59a771b4f8885f887958bfddeb2";
  let _spotifyToken = null;
  let _spotifyTokenExpiry = 0;

  async function getSpotifyToken() {
    const now = Date.now();
    if (_spotifyToken && now < _spotifyTokenExpiry - 5000) return _spotifyToken;
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    const j = await res.json();
    _spotifyToken = j.access_token;
    _spotifyTokenExpiry = now + (j.expires_in || 3600)*1000;
    return _spotifyToken;
  }

  async function getArtistFollowers(artistId) {
    try {
      const token = await getSpotifyToken();
      const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const json = await res.json();
      return json.followers?.total || 0;
    } catch (err) { console.error('getArtistFollowers error', err); return 0; }
  }

  window.searchArtist = async function() {
    const q = document.getElementById('search')?.value;
    if (!q) return;
    const results = document.getElementById('results');
    results.innerHTML = `<div class="card">Searching...</div>`;
    try {
      const token = await getSpotifyToken();
      const resp = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=artist&limit=8`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const json = await resp.json();
      const items = json.artists?.items || [];
      if (!items.length) return results.innerHTML = `<div class="card">No artists found.</div>`;

      results.innerHTML = '';
      items.forEach(artist => {
        const img = artist.images?.[0]?.url || '';
        const card = document.createElement('div');
        card.className = 'artist-card';
        card.innerHTML = `
          ${img ? `<img src="${escapeAttr(img)}" alt="${escapeAttr(artist.name)}">` : ''}
          <h3>${escapeHtml(artist.name)}</h3>
          <p>Followers: ${Number(artist.followers?.total || 0).toLocaleString()}</p>
          <p class="muted">Genres: ${(artist.genres || []).slice(0,3).join(', ') || 'N/A'}</p>
          <input type="number" id="amount-${artist.id}" placeholder="Credits to invest" min="1"/>
          <button data-id="${artist.id}" data-name="${escapeAttr(artist.name)}">Invest</button>
        `;
        card.querySelector('button').addEventListener('click', async () => {
          const amt = document.getElementById(`amount-${artist.id}`).value;
          await window.invest(artist.id, artist.name, parseInt(amt, 10));
        });
        results.appendChild(card);
      });
    } catch (err) { console.error('searchArtist error', err); results.innerHTML = `<div class="card">Error fetching results.</div>`; }
  };

  // ---------- Invest ----------
  window.invest = async function(artistId, artistName, amount) {
    if (!currentUser) return alert('Please log in first');
    if (!amount || amount <= 0) return alert('Enter a valid amount');

    try {
      const ref = db.collection('users').doc(currentUser.uid);
      const snap = await ref.get();
      let data = snap.exists ? (snap.data() || {}) : { balance: 10000, investments: {} };
      let balance = Number(data.balance || 0);
      let investments = data.investments || {};

      const fee = Math.ceil(amount * 0.02);
      const totalCost = amount + fee;
      if (balance < totalCost) return alert('Not enough balance');

      balance -= totalCost;
      if (!investments[artistId]) {
        investments[artistId] = { artistName, amount, followersAtPurchase: 0, currentFollowers: 0 };
      } else {
        investments[artistId].amount += amount;
      }

      await ref.update({ balance, investments });

      const followers = await getArtistFollowers(artistId);
      investments[artistId].followersAtPurchase = followers;
      investments[artistId].currentFollowers = followers;
      await ref.update({ investments });

      loadPortfolio();
      showPage('portfolio');
      alert(`Invested ${amount} credits in ${artistName} (fee ${fee})`);
    } catch (err) { console.error('invest error', err); alert('Error performing investment.'); }
  };

  // ---------- Utilities ----------
  function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
  function escapeAttr(str) { return escapeHtml(str).replace(/"/g, '&quot;'); }

  // Ensure navbar exists
  if (!document.getElementById('navbar')) {
    const nav = document.createElement('nav');
    nav.id = 'navbar';
    nav.classList.add('hidden');
    nav.innerHTML = `
      <button onclick="showPage('home')">Home</button>
      <button onclick="showPage('portfolio')">Portfolio</button>
      <button onclick="showPage('trade')">Trade</button>
      <button onclick="logOut()">Log Out</button>
    `;
    document.body.insertBefore(nav, document.querySelector('.container') || document.body.firstChild);
  }

});
