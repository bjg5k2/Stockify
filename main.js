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
    document.getElementById("welcome-section")?.style.setProperty("display", "block");
    loadUserData(currentUser.uid);
  } else {
    currentUser = null;
    document.getElementById("auth-section").style.display = "block";
    document.getElementById("logout-btn").style.display = "none";
    document.getElementById("welcome-section")?.style.setProperty("display", "none");
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
  const sorted = Object.en
