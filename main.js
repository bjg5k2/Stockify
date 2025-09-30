// Firebase config (yours already provided earlier)
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

    // Create portfolio with default balance
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

// ===== TRADE (Search + Invest) =====
async function searchArtist() {
  const query = document.getElementById("search").value;
  if (!query) return;

  // Demo mock search (replace with Spotify later)
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  const demoArtists = [
    { name: "Post Malone", followers: "35M" },
    { name: "Drake", followers: "80M" }
  ];

  demoArtists.forEach(artist => {
    const card = document.createElement("div");
    card.innerHTML = `
      <h3>${artist.name}</h3>
      <p>Followers: ${artist.followers}</p>
      <input type="number" id="amount-${artist.name}" placeholder="Amount"/>
      <button onclick="invest('${artist.name}')">Invest</button>
    `;
    resultsDiv.appendChild(card);
  });
}

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
