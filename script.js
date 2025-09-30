// ----- Firebase Setup -----
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "stockify-75531.firebaseapp.com",
  projectId: "stockify-75531",
  storageBucket: "stockify-75531.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ----- Login / Signup -----
async function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await auth.createUserWithEmailAndPassword(email, password);
    alert("Signed up!");
    document.getElementById("auth-section").style.display = "none";
    initPortfolio();
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
    document.getElementById("auth-section").style.display = "none";
    initPortfolio();
  } catch (err) {
    alert(err.message);
  }
}

auth.onAuthStateChanged(user => {
  if (user) {
    console.log("Logged in as:", user.email);
    document.getElementById("auth-section").style.display = "none";
    initPortfolio();
  }
});

// ----- Page Navigation -----
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  document.getElementById(`${pageId}-page`).style.display = "block";
}

// ----- Spotify API -----
const clientId = "YOUR_CLIENT_ID";
const clientSecret = "YOUR_CLIENT_SECRET";

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
  // Initialize portfolio in memory; later you can persist in localStorage
  updatePortfolioUI();
}

function invest(artistId, artistName) {
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
