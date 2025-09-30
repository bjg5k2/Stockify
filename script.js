// ----- Firebase Setup -----
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

// ----- Track Current User -----
let currentUser = null;

// ----- Login / Signup -----
async function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await auth.createUserWithEmailAndPassword(email, password);
    alert("Signed up!");
  } catch (err) {
    alert(err.message);
  }
}

async function logIn() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await auth.signInWithEmailAndPassword(email, password);
    alert("Logged in!");
  } catch (err) {
    alert(err.message);
  }
}

// Update user state
auth.onAuthStateChanged(user => {
  currentUser = user;
  if (user) {
    console.log("Logged in as:", user.email);
    document.getElementById("auth-section").style.display = "none";
    initPortfolio();
    showPage("home");
  } else {
    document.getElementById("auth-section").style.display = "block";
  }
});

// ----- Page Navigation -----
function showPage(pageId) {
  if (!currentUser) {
    alert("Please log in to access this page.");
    return;
  }
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  document.getElementById(`${pageId}-page`).style.display = "block";
}

// ----- Spotify API -----
const clientId = "b0450273fe7d41a08cc3ea93a2e733ae";
const clientSecret = "5b22a59a771b4f8885f887958bfddeb2";

async function getToken() {
  const resp = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(clientId + ":" + clientSecret),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  const data = await resp.json();
  return data.access_token;
}

// ----- Search Artists -----
async function searchArtist() {
  const name = document.getElementById("search-input").value;
  const token = await getToken();
  const resp = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=10`, {
    headers: { "Authorization": "Bearer " + token }
  });
  const data = await resp.json();

  const resultsDiv = document.getElementById("artist-results");
  resultsDiv.innerHTML = "";

  if (!data.artists.items.length) {
    resultsDiv.innerHTML = "No artists found.";
    return;
  }

  data.artists.items.forEach(artist => {
    const artistDiv = document.createElement("div");
    artistDiv.className = "artist-card";
    artistDiv.innerHTML = `
      <img src="${artist.images[0]?.url || ''}" alt="${artist.name}">
      <p><strong>${artist.name}</strong></p>
      <p>Followers: ${artist.followers.total.toLocaleString()}</p>
      <button onclick="invest('${artist.id}','${artist.name}')">Invest</button>
    `;
    resultsDiv.appendChild(artistDiv);
  });
}

// ----- Portfolio & Investing -----
let userPortfolio = {}; // key: artistId, value: {name, credits}
let userCredits = 10000;

function initPortfolio() {
  // Initialize portfolio in memory
  updatePortfolioUI();
}

function invest(artistId, artistName) {
  if (!currentUser) return alert("Please log in to invest.");
  const amount = prompt(`You have ${userCredits} credits. Enter amount to invest in ${artistName}:`);
  const investAmount = parseInt(amount);
  if (isNaN(investAmount) || investAmount <= 0) return alert("Enter a valid number");
  if (investAmount > userCredits) return alert("Not enough credits");

  const fee = Math.ceil(investAmount * 0.02);
  const totalCost = investAmount + fee;
  if (totalCost > userCredits) return alert(`Not enough credits for 2% fee. Total cost: ${totalCost}`);

  userCredits -= totalCost;

  if (!userPortfolio[artistId]) userPortfolio[artistId] = { name: artistName, credits: 0 };
  userPortfolio[artistId].credits += investAmount;

  updatePortfolioUI();
}

function updatePortfolioUI() {
  const portfolioDiv = document.getElementById("portfolio-list");
  portfolioDiv.innerHTML = `<p>Total Credits: ${userCredits}</p>`;
  for (const id in userPortfolio) {
    const artist = userPortfolio[id];
    const div = document.createElement("div");
    div.textContent = `${artist.name}: ${artist.credits} credits invested`;
    portfolioDiv.appendChild(div);
  }
}
