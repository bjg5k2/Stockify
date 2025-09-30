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

// -------------------- Portfolio Data --------------------
let userPortfolio = {};
let userCredits = 10000;
const userId = "demoUser";

// -------------------- Load / Save Firestore --------------------
async function loadUserData() {
  const docRef = db.collection("users").doc(userId);
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
  await db.collection("users").doc(userId).set({
    credits: userCredits,
    portfolio: userPortfolio
  });
}

// -------------------- Portfolio / Top Functions --------------------
function updatePortfolioUI() {
  const portfolioDiv = document.getElementById("portfolio-list");
  if (!portfolioDiv) return;
  portfolioDiv.innerHTML = "";
  const creditsSpan = document.getElementById("user-credits");
  if (creditsSpan) creditsSpan.textContent = userCredits;
  if (Object.keys(userPortfolio).length === 0) {
    portfolioDiv.innerHTML = "<p>No investments yet.</p>";
    return;
 

  
