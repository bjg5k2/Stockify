// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBF5gzPThKD1ga_zpvtdBpiQFsexbEpZyY",
  authDomain: "stockify-75531.firebaseapp.com",
  projectId: "stockify-75531",
  storageBucket: "stockify-75531.firebasestorage.app",
  messagingSenderId: "831334536771",
  appId: "1:831334536771:web:b142abcead4df128c826f6"
};

// Init Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Global user
let currentUser = null;

// ===== AUTH =====
async function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    currentUser = userCredential.user;

    await db.collection("users").doc(currentUser.uid).set({
      balance: 10000,
      investments: {}
    });

    showApp();
  } catch (error) {
    alert(error.message);
  }
}

async function logIn() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    currentUser = userCredential.user;
    showApp();
    loadPortfolio();
  } catch (error) {
    alert(error.message);
  }
}

async function logOut() {
  await auth.signOut();
  currentUser = null;
  document.getElementById("auth-section").classList.remove("hidden");
  document.getElementById("navbar").classList.add("hidden");
  hideAllPages();
  document.getElementById("auth-section").classList.add("active");
}

// ===== UI TOGGLING =====
function showApp() {
  document.getElementById("auth-section").classList.add("hidden");
  document.getElementById("navbar").classList.remove("hidden");
  showPage("home");
}

function hideAllPages() {
  document.querySelectorAll(".page").forEach(div => div.classList.add("hidden"));
}

function showPage(pageId) {
  hideAllPages();
  document.getElementById(pageId).classList.remove("hidden");
}

// ===== PORTFOLIO =====
async function loadPortfolio() {
  if (!currentUser) return;
  const doc = await db.collection("users").doc(currentUser.uid).get();
  if (doc.exists) {
    const data = doc.data();
    document.getElementById("balance").innerText = `Balance: ${data.balance} credits`;
    displayPortfolio(data.investments);
  }
}

function displayPortfolio(investments) {
  const container = document.getElementById("investments");
  container.innerHTML = "";
  for (const [artist, amount] of Object.entries(investments)) {
    const div = document.createElement("div");
    div.textContent = `${artist}: ${amount} credits invested`;
    container.appendChild(div);
  }
}

// ===== SPOTIFY SEARCH =====
const clientId = "b0450273fe7d41a08cc3ea93a2e733ae";
const clientSecret = "5b22a59a771b4f8885f887958bfddeb2";

async function getSpotifyToken() {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(clientId + ":" + clientSecret),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  const data = await response.json();
  return data.access_token;
}

async function searchArtist() {
  const query = document.getElementById("search").value;
  if (!query) return;

  const token = await getSpotifyToken();
  const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=5`, {
    headers: { Authorization: "Bearer " + token }
  });
  const data = await response.json();

  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  data.artists.items.forEach(artist => {
    const img = artist.images.length > 0 ? artist.images[0].url : "";
    const card = document.createElement("div");
    card.innerHTML = `
      <h3>${artist.name}</h3>
      ${img ? `<img src="${img}" alt="${artist.name}" width="100"/>` : ""}
      <p>Followers: ${artist.followers.total.toLocaleString()}</p>
      <input type="number" id="amount-${artist.name}" placeholder="Amount"/>
      <button onclick="invest('${artist.name}')">Invest</button>
    `;
    resultsDiv.appendChild(card);
  });
}

// ===== INVEST =====
async function invest(artist) {
  const amountInput = document.getElementById(`amount-${artist}`).value;
  const amount = parseInt(amountInput);
  if (!amount || amount <= 0) return alert("Enter a valid amount");

  const userRef = db.collection("users").doc(currentUser.uid);
  const doc = await userRef.get();
  const data = doc.data();

  if (data.balance < amount) return alert("Not enough balance!");

  const fee = Math.ceil(amount * 0.02);
  const newBalance = data.balance - amount - fee;

  const investments = data.investments || {};
  investments[artist] = (investments[artist] || 0) + amount;

  await userRef.update({
    balance: newBalance,
    investments
  });

  loadPortfolio();
}
