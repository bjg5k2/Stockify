let auth, db;
const SPOTIFY_TOKEN = 'BQD-your-temporary-token-here'; // replace with a temporary token if expired

// ----- Firebase -----
const firebaseConfig = {
  apiKey: "AIzaSyBF5gzPThKD1ga_zpvtdBpiQFsexbEpZyY",
  authDomain: "stockify-75531.firebaseapp.com",
  projectId: "stockify-75531",
  storageBucket: "stockify-75531.appspot.com",
  messagingSenderId: "831334536771",
  appId: "1:831334536771:web:b142abcead4df128c826f6"
};
firebase.initializeApp(firebaseConfig);
auth = firebase.auth();
db = firebase.firestore();

// ----- Auth -----
window.signUp = async function() {
  const email = document.querySelector('#auth-section input[type="email"]').value;
  const password = document.querySelector('#auth-section input[type="password"]').value;
  try {
    const uc = await auth.createUserWithEmailAndPassword(email, password);
    const user = uc.user;
    await db.collection('users').doc(user.uid).set({ balance:10000, investments:{} });
    showAppUI();
    loadPortfolio();
  } catch(e) { alert(e.message); }
};

window.logIn = async function() {
  const email = document.querySelector('#auth-section input[type="email"]').value;
  const password = document.querySelector('#auth-section input[type="password"]').value;
  try {
    const uc = await auth.signInWithEmailAndPassword(email, password);
    showAppUI();
    loadPortfolio();
  } catch(e) { alert(e.message); }
};

window.logOut = async function() {
  await auth.signOut();
  window.location.reload();
};

// ----- UI -----
function showAppUI() {
  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('navbar').classList.remove('hidden');
  showPage('home');
}

// ----- Page switching -----
window.showPage = function(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(pageId);
  if(page) page.classList.add('active');
  if(pageId === 'portfolio') loadPortfolio();
};

document.getElementById('logout-btn').addEventListener('click', logOut);
document.querySelectorAll('#navbar-left button[data-page]').forEach(btn=>{
  btn.addEventListener('click', ()=>showPage(btn.dataset.page));
});

// ----- Auth state -----
auth.onAuthStateChanged(user=>{
  if(user){ showAppUI(); loadPortfolio(); }
});

// ----- Portfolio -----
async function loadPortfolio() {
  const user = auth.currentUser;
  if(!user) return;
  const ref = db.collection('users').doc(user.uid);
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : { balance:10000, investments:{} };
  if(!data.investments) data.investments={};
  document.getElementById('balance').innerText = `Balance: ${data.balance} credits`;
  displayPortfolio(data.investments);
}

function displayPortfolio(investments={}) {
  const container = document.getElementById('investments');
  container.innerHTML = '';
  const entries = Object.entries(investments);
  if(!entries.length){ container.innerHTML='<div class="card">No investments yet.</div>'; return; }
  entries.forEach(([artist, amt])=>{
    const d = document.createElement('div');
    d.className='investment-item card';
    d.innerHTML=`<div>${artist}</div><div><strong>${amt} credits</strong></div>`;
    container.appendChild(d);
  });
}

// ----- Trade -----
document.getElementById('search-btn').addEventListener('click', searchArtist);

async function searchArtist() {
  const q = document.getElementById('search').value;
  if(!q) return;
  const results = document.getElementById('results');
  results.innerHTML='<div class="card">Searching...</div>';

  try {
    const resp = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=artist&limit=8`, {
      headers:{'Authorization':'Bearer '+SPOTIFY_TOKEN}
    });
    const json = await resp.json();
    const items = json.artists?.items||[];
    if(!items.length){ results.innerHTML='<div class="card">No artists found.</div>'; return; }

    results.innerHTML='';
    items.forEach(artist=>{
      const img = artist.images?.[0]?.url||'';
      const idSafe = artist.id;
      const card = document.createElement('div');
      card.className='artist-card';
      card.innerHTML=`
        ${img?`<img src="${img}" alt="${artist.name}">`:''}
        <h3>${artist.name}</h3>
        <p>Followers: ${artist.followers.total.toLocaleString()}</p>
        <input type="number" id="amount-${idSafe}" placeholder="Credits to invest" min="1"/>
        <button data-id="${idSafe}" data-name="${artist.name}">Invest</button>
      `;
      card.querySelector('button').addEventListener('click', ()=>{
        const amt = parseInt(document.getElementById(`amount-${idSafe}`).value,10);
        invest(artist.name, amt);
      });
      results.appendChild(card);
    });
  } catch(e){ console.error(e); results.innerHTML='<div class="card">Error fetching results. Check console.</div>'; }
}

// ----- Invest -----
async function invest(artistName, amount) {
  const user = auth.currentUser;
  if(!user) return alert('Please log in first');
  if(!amount||amount<=0) return alert('Enter a valid amount');

  const ref = db.collection('users').doc(user.uid);
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : { balance:10000, investments:{} };
  const balance = Number(data.balance||0);
  const investments = data.investments||{};
  const fee = Math.ceil(amount*0.02);
  const totalCost = amount+fee;
  if(balance<totalCost) return alert('Not enough balance');

  investments[artistName]=(investments[artistName]||0)+amount;
  const newBalance = balance-totalCost;
  await ref.set({ balance:newBalance, investments },{merge:true});
  alert(`Invested ${amount} credits in ${artistName} (fee ${fee})`);
  loadPortfolio();
  showPage('portfolio');
}
