// -------------------- Firebase Setup --------------------
const firebaseConfig = {
  apiKey: "AIzaSyBF5gzPThKD1ga_zpvtdBpiQFsexbEpZyY",
  authDomain: "stockify-75531.firebaseapp.com",
  projectId: "stockify-75531",
  storageBucket: "stockify-75531.firebasestorage.app",
  messagingSenderId: "831334536771",
  appId: "1:831334536771:web:b142abcead4df128c826f6"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let currentUser = null;
let userPortfolio = {};
let userCredits = 10000;

// -------------------- Auth Functions --------------------
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("logout-btn").style.display = "inline-block";
    const welcomeSection = document.getElementById("welcome-section");
    if (welcomeSection) welcomeSection.style.display = "block";
    loadUserData(currentUser.uid);
  } else {
    currentUser = null;
    document.getElementById("auth-section").style.display = "block";
    document.getElementById("logout-btn").style.display = "none";
    const welcomeSection = document.getElementById("welcome-section");
    if (welcomeSection) welcomeSection.style.display = "none";
  }
});

async function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    currentUser = userCredential.user;
    await db.collection("users").doc(currentUser.uid).set({
      credits: 10000,
      portfolio: {}
    });
    document.getElementById("auth-msg").textContent = "Sign up successful!";
    loadUserData(currentUser.uid);
  } catch (error) {
    document.getElementById("auth-msg").textContent = error.message;
  }
}

async function logIn() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    currentUser = userCredential.user;
    document.getElementById("auth-msg").textContent = "Login successful!";
    loadUserData(currentUser.uid);
  } catch (error) {
    document.getElementById("auth-msg").textContent = error.message;
  }
}

function logOut() {
  auth.signOut();
}

// -------------------- Portfolio / Firestore Functions --------------------
async function loadUserData(uid) {
  const docRef = db.collection("users").doc(uid);
  const docSnap = await docRef.get();
  if (docSnap.exists) {
    const data = docSnap.data();
    userCredits = data.credits;
    userPortfolio = data.portfolio || {};
  } else {
    await docRef.set({ credits: 10000, portfolio: {} });
    userCredits = 10000;
    userPortfolio = {};
  }
  updatePortfolioUI();
  updateTopPerformers();
}

async function saveUserData() {
  if (!currentUser) return;
  await db.collection("users").doc(currentUser.uid).set({
    credits: userCredits,
    portfolio: userPortfolio
  });
}

// -------------------- UI Update Functions --------------------
function updatePortfolioUI() {
  const portfolioDiv = document.getElementById("portfolio-list");
  if (!portfolioDiv) return;
  portfolioDiv.innerHTML = "";
  const creditsSpan = document.getElementById("user-credits");
  if (creditsSpan) creditsSpan.textContent = userCredits;
  if (Object.keys(userPortfolio).length === 0) {
    portfolioDiv.innerHTML = "<p>No investments yet.</p>";
    return;
  }
  for (const artistId in userPortfolio) {
    const card = document.createElement("div");
    card.className = "portfolio-card";
    card.innerHTML = `<h3>${userPortfolio[artistId].name}</h3>
                      <p>Credits Invested: ${userPortfolio[artistId].credits}</p>`;
    portfolioDiv.appendChild(card);
  }
}

function updateTopPerformers() {
  const topDiv = document.getElementById("top-list");
  if (!topDiv) return;
  topDiv.innerHTML = "";
  if (Object.keys(userPortfolio).length === 0) {
    topDiv.innerHTML = "<p>No investments yet.</p>";
    return;
  }
  const sorted = Object.entries(userPortfolio).sort((a,b)=>b[1].credits-a[1].credits);
  for (let [artistId, data] of sorted) {
    const card = document.createElement("div");
    card.className = "top-card";
    card.innerHTML = `<h3>${data.name}</h3>
                      <p>Credits: ${data.credits}</p>`;
    topDiv.appendChild(card);
  }
}

// -------------------- Investment Function --------------------
async function invest(artistId, artistName) {
  if (!currentUser) return alert("You must be logged in to invest.");
  const amount = parseInt(prompt(`You have ${userCredits} credits. Enter amount to invest in ${artistName}:`));
  if (isNaN(amount) || amount <= 0) return alert("Enter a valid number");
  if (amount > userCredits) return alert("Not enough credits");

  const fee = Math.ceil(amount * 0.02);
  const totalCost = amount + fee;
  if (totalCost > userCredits) return alert(`Not enough credits for 2% fee. Total cost: ${totalCost}`);

  userCredits -= totalCost;
  if (!userPortfolio[artistId]) userPortfolio[artistId] = { name: artistName, credits: 0 };
  userPortfolio[artistId].credits += amount;

  updatePortfolioUI();
  updateTopPerformers();
  await saveUserData();
  alert(`Invested ${amount} credits in ${artistName}!`);
}

// -------------------- Spotify Search Function --------------------
async function searchArtist() {
  const query = document.getElementById("search-input").value;
  if (!query) return;
  // Replace with actual Spotify API fetch later
  const mockResults = [
    { id: "1", name: "Ariana Grande", image: "https://via.placeholder.com/150" },
    { id: "2", name: "Drake", image: "https://via.placeholder.com/150" }
  ];
  const resultsDiv = document.getElementById("artist-results");
  resultsDiv.innerHTML = "";
  mockResults.forEach(artist => {
    if (!artist.name.toLowerCase().includes(query.toLowerCase())) return;
    const card = document.createElement("div");
    card.className = "artist-card";
    card.innerHTML = `<img src="${artist.image}" alt="${artist.name}">
                      <h3>${artist.name}</h3>
                      <button class="invest-btn" onclick="invest('${artist.id}','${artist.name}')">Invest</button>`;
    resultsDiv.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Auth state listener handles loading user data
});
