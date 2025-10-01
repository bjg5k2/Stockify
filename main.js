let auth, db;
let _spotifyToken = null;
let _spotifyExpiry = 0;

fetch('/config')
  .then(res => res.json())
  .then(config => {
    firebase.initializeApp(config.firebase);
    auth = firebase.auth();
    db = firebase.firestore();

    auth.onAuthStateChanged(user => {
      if (!user) window.location.href = 'index.html';
    });

    initializeApp(config.spotify);
  })
  .catch(err => {
    console.error('Failed to load config:', err);
    alert('Failed to initialize app. Please refresh the page.');
  });

function initializeApp(spotifyConfig) {
  window.showPage = function(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');
    if(pageId === 'portfolio') loadPortfolio();
  };

  document.querySelectorAll('#navbar-left button[data-page]')
    .forEach(btn => btn.addEventListener('click', () => showPage(btn.dataset.page)));

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await auth.signOut();
    window.location.href = 'index.html';
  });

  document.getElementById('search-btn').addEventListener('click', searchArtist);
}

async function loadPortfolio() {
  const user = auth.currentUser;
  if (!user) return;
  const ref = db.collection('users').doc(user.uid);
  const snap = await ref.get();
  let data = snap.exists ? snap.data() : { balance: 10000, investments: {} };
  if (!data.investments) data.investments = {};
  document.getElementById('balance').innerText = `Balance: ${data.balance} credits`;
  displayPortfolio(data.investments);
}

function displayPortfolio(investments = {}) {
  const container = document.getElementById('investments');
  container.innerHTML = '';
  const entries = Object.entries(investments);
  if (!entries.length) container.innerHTML = '<div class="card">No investments yet.</div>';
  entries.forEach(([artist, amt]) => {
    const d = document.createElement('div');
    d.className = 'investment-item card';
    d.innerHTML = `<div>${artist}</div><div><strong>${amt} credits</strong></div>`;
    container.appendChild(d);
  });
}

async function getSpotifyToken() {
  const now = Date.now();
  if (_spotifyToken && now < _spotifyExpiry - 5000) return _spotifyToken;
  const res = await fetch('/api/spotify-token');
  const json = await res.json();
  _spotifyToken = json.access_token;
  _spotifyExpiry = now + (json.expires_in || 3600) * 1000;
  return _spotifyToken;
}

async function searchArtist() {
  const q = document.getElementById('search').value;
  if (!q) return;
  const results = document.getElementById('results');
  results.innerHTML = '<div class="card">Searching...</div>';
  try {
    const token = await getSpotifyToken();
    const resp = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=artist&limit=8`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const json = await resp.json();
    const items = json.artists?.items || [];
    if (!items.length) { results.innerHTML = '<div class="card">No artists found.</div>'; return; }
    results.innerHTML = '';
    items.forEach(artist => {
      const img = artist.images?.[0]?.url || '';
      const idSafe = artist.id;
      const card = document.createElement('div');
      card.className = 'artist-card';
      card.innerHTML = `
        ${img ? `<img src="${img}" alt="${artist.name}">` : ''}
        <h3>${artist.name}</h3>
        <p>Followers: ${artist.followers.total.toLocaleString()}</p>
        <input type="number" id="amount-${idSafe}" placeholder="Credits to invest" min="1"/>
        <button data-id="${idSafe}" data-name="${artist.name}">Invest</button>
      `;
      const btn = card.querySelector('button');
      btn.addEventListener('click', () => {
        const amt = parseInt(document.getElementById(`amount-${idSafe}`).value, 10);
        invest(artist.name, amt);
      });
      results.appendChild(card);
    });
  } catch(err) {
    console.error('Spotify search error', err);
    results.innerHTML = '<div class="card">Error fetching results. Check console.</div>';
  }
}

async function invest(artistName, amount) {
  const user = auth.currentUser;
  if (!user) return alert('Please log in first');
  if (!amount || amount <= 0) return alert('Enter a valid amount');
  const ref = db.collection('users').doc(user.uid);
  const snap = await ref.get();
  let data = snap.exists ? snap.data() : { balance: 10000, investments: {} };
  const balance = Number(data.balance || 0);
  const investments = data.investments || {};
  const fee = Math.ceil(amount * 0.02);
  const totalCost = amount + fee;
  if (balance < totalCost) return alert('Not enough balance');
  investments[artistName] = (investments[artistName] || 0) + amount;
  const newBalance = balance - totalCost;
  await ref.set({ balance: newBalance, investments }, { merge: true });
  alert(`Invested ${amount} credits in ${artistName} (fee ${fee})`);
  loadPortfolio();
  showPage('portfolio');
}
