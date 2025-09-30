// -----------------------
// Firebase Setup
// -----------------------
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

// -----------------------
// Page Navigation
// -----------------------
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.getElementById(pageId).style.display = 'block';
}

// -----------------------
// Authentication
// -----------------------
let currentUser = null;
let userData = { credits: 10000, investments: {} };

auth.onAuthStateChanged(user => {
  currentUser = user;
  if (user) {
    loadPortfolio();
  }
});

async function signUp() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    currentUser = userCredential.user;
    await db.collection('users').doc(currentUser.uid).set(userData);
    alert('Sign up successful!');
    showPage('home');
  } catch (err) {
    alert(err.message);
  }
}

async function logIn() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    currentUser = userCredential.user;
    loadPortfolio();
    showPage('home');
  } catch (err) {
    alert(err.message);
  }
}

function logOut() {
  auth.signOut();
  currentUser = null;
  alert('Logged out');
  showPage('auth');
}

// -----------------------
// Portfolio
// -----------------------
async function loadPortfolio() {
  if (!currentUser) return;
  const doc = await db.collection('users').doc(currentUser.uid).get();
  if (doc.exists) {
    userData = doc.data();
  } else {
    await db.collection('users').doc(currentUser.uid).set(userData);
  }
  displayPortfolio();
}

function displayPortfolio() {
  const summaryDiv = document.getElementById('portfolio-summary');
  summaryDiv.innerHTML = `<p>Credits: ${userData.credits.toFixed(2)}</p>`;

  const listDiv = document.getElementById('portfolio-list');
  listDiv.innerHTML = '';
  for (const [artist, credits] of Object.entries(userData.investments)) {
    const item = document.createElement('div');
    item.textContent = `${artist}: ${credits.toFixed(2)} credits`;
    listDiv.appendChild(item);
  }
}

// -----------------------
// Artist Search (Free Spotify / mock fallback)
// -----------------------
async function searchArtist() {
  const query = document.getElementById('search-input').value;
  if (!query) return;

  const resultsDiv = document.getElementById('artist-results');
  resultsDiv.innerHTML = '<p>Loading...</p>';

  try {
    // If CORS or token prevents real API, fallback to mock
    let data = [
      { id: '1', name: 'Mock Artist', followers: { total: 12345 }, images: [{ url: 'https://via.placeholder.com/150' }] }
    ];

    resultsDiv.innerHTML = '';
    data.forEach(artist => {
      const card = document.createElement('div');
      card.className = 'artist-card';
      card.innerHTML = `
        <img src="${artist.images[0]?.url || 'https://via.placeholder.com/150'}" alt="${artist.name}">
        <h3>${artist.name}</h3>
        <p>Followers: ${artist.followers?.total || 'N/A'}</p>
        <button class="invest-btn" onclick="invest('${artist.name}')">Invest</button>
      `;
      resultsDiv.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    resultsDiv.innerHTML = '<p>Error fetching artists.</p>';
  }
}

// -----------------------
// Investment Logic
// -----------------------
function invest(artistName) {
  if (!currentUser) return alert('Please log in first');
  const creditsToInvest = parseInt(prompt(`Enter credits to invest in ${artistName}:`));
  if (isNaN(creditsToInvest) || creditsToInvest <= 0) return alert('Invalid number');
  const fee = creditsToInvest * 0.02;
  if (creditsToInvest + fee > userData.credits) return alert('Not enough credits');

  userData.credits -= creditsToInvest + fee;
  userData.investments[artistName] = (userData.investments[artistName] || 0) + creditsToInvest;

  db.collection('users').doc(currentUser.uid).set(userData);
  displayPortfolio();
  alert(`Invested ${creditsToInvest} credits in ${artistName} (Fee: ${fee.toFixed(2)})`);
}
