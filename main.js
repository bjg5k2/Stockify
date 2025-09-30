let balance = 10000;
let investments = {};

document.addEventListener('DOMContentLoaded', () => {
  function hideAllPages() {
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  }

  window.showPage = function(pageId) {
    hideAllPages();
    const el = document.getElementById(pageId);
    if (el) el.classList.add('active');
    if (pageId === 'portfolio') displayPortfolio();
  };

  function displayPortfolio() {
    const container = document.getElementById('investments');
    container.innerHTML = '';
    document.getElementById('balance').innerText = `Balance: ${balance} credits`;
    const entries = Object.entries(investments);
    if (!entries.length) { container.innerHTML = '<div class="card">No investments yet.</div>'; return; }
    entries.forEach(([artist, amt]) => {
      const d = document.createElement('div');
      d.className = 'investment-item card';
      d.innerHTML = `<div>${artist}</div><div><strong>${amt} credits</strong></div>`;
      container.appendChild(d);
    });
  }

  // --- Spotify search ---
  const SPOTIFY_CLIENT_ID = "b0450273fe7d41a08cc3ea93a2e733ae";
  const SPOTIFY_CLIENT_SECRET = "5b22a59a771b4f8885f887958bfddeb2";
  let _spotifyToken = null;
  let _spotifyTokenExpiry = 0;

  async function getSpotifyToken() {
    const now = Date.now();
    if (_spotifyToken && now < _spotifyTokenExpiry - 5000) return _spotifyToken;
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method:'POST',
      headers:{ 'Authorization':'Basic '+btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`), 'Content-Type':'application/x-www-form-urlencoded' },
      body:'grant_type=client_credentials'
    });
    const j = await res.json();
    _spotifyToken = j.access_token;
    _spotifyTokenExpiry = now + (j.expires_in||3600)*1000;
    return _spotifyToken;
  }

  window.searchArtist = async function() {
    const q = document.getElementById('search').value;
    if(!q) return;
    const results = document.getElementById('results');
    results.innerHTML = '<div class="card">Searching...</div>';
    try {
      const token = await getSpotifyToken();
      const resp = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=artist&limit=8`, { headers: { Authorization:'Bearer '+token }});
      const json = await resp.json();
      const items = json.artists?.items || [];
      if(!items.length){ results.innerHTML='<div class="card">No artists found.</div>'; return; }
      results.innerHTML = '';
      items.forEach(artist => {
        const img = artist.images?.[0]?.url || '';
        const idSafe = artist.id;
        const card = document.createElement('div');
        card.className = 'artist-card';
        card.innerHTML = `
          ${img? `<img src="${img}" alt="${artist.name}">` : ''}
          <h3>${artist.name}</h3>
          <p>Followers: ${Number(artist.followers?.total||0).toLocaleString()}</p>
          <p class="muted">Genres: ${(artist.genres||[]).slice(0,3).join(',')||'N/A'}</p>
          <input type="number" id="amount-${idSafe}" placeholder="Credits to invest" min="1"/>
          <button>Invest</button>
        `;
        card.querySelector('button').addEventListener('click', ()=>{
          const amt = parseInt(document.getElementById(`amount-${idSafe}`).value,10);
          if(!amt||amt<=0) return alert('Enter a valid amount');
          if(balance<amt) return alert('Not enough balance');
          balance -= amt;
          investments[artist.name] = (investments[artist.name]||0)+amt;
          displayPortfolio();
        });
        results.appendChild(card);
      });
    } catch(err){ console.error(err); results.innerHTML='<div class="card">Error fetching results</div>'; }
  };
});
