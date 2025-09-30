document.addEventListener('DOMContentLoaded', () => {
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
  window.showPage = function(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
  };

  // -----------------------
  // Authentication
  // -----------------------
  let currentUser = null;
  let userData = { credits: 10000, investments: {} };

  auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) loadPortfolio();
  });

  window.signUp = async function() {
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
  };

  window.logIn = async function() {
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
  };

  window.logOut = function() {
    auth.signOut();
    currentUser = null;
    alert('Logged out');
    showPage('auth');
  };

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
  // Spotify Client Credentials
  // -----------------------
  const SPOTIFY_CLIENT_ID = "b0450273fe7d41a08cc3ea93a2e733ae";
  const SPOTIFY_CLIENT_SECRET = "5b22a59a771b4f8885f887958bfddeb2";
  let spotifyToken = "";

  async function getSpotifyToken() {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    const data = await res.json();
    spotifyToken = data.access_token;
  }

  // -----------------------
  // Live Spotify Artist Search
  // -----------------------
  window.searchArtist = async function() {
    const query = document.getElementById('search-input').value;
    if (!query) return;

    const resultsDiv = document.getElementById('artist-results');
    resultsDiv.innerHTML = '<p>Loading...</p>';

    try {
      if (!spotifyToken) await getSpotifyToken();

      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=10`, {
        headers: { 'Authorization': `Bearer ${spotifyToken}` }
      });

      const data = await response.json();

      resultsDiv.innerHTML = '';
      if (!data.artists || !data.artists.items.length) {
        resultsDiv.innerHTML = '<p>No artists found.</p>';
        return;
      }

      data.artists.items.forEach(artist => {
        const card = document.createElement('div');
        card.className = 'artist-card';
        card.innerHTML = `
          <img src="${artist.images[0]?.url || 'https://via.placeholder.com/150'}" alt="${artist.name}">
          <h3>${artist.name}</h3>
          <p>Followers: ${artist.followers?.total.toLocaleString() || 'N/A'}</p>
          <p>Genres: ${artist.genres.join(', ') || 'N/A'}</p>
          <p>Popularity: ${artist.popularity || 'N/A'}</p>
          <button class="invest-btn" onclick="invest('${artist.name}')">Invest</button>
        `;
        resultsDiv
