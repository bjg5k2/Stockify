let currentUser = null;

// ------------------ AUTH FUNCTIONS ------------------
async function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    await db.collection("users").doc(user.uid).set({ credits: 10000, portfolio: [] });
    alert("Account created! You have 10,000 credits.");
    logIn();
  } catch (err) { alert(err.message); }
}

async function logIn() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    const doc = await db.collection("users").doc(user.uid).get();
    if(doc.exists){
      currentUser = { uid: user.uid, ...doc.data(), email, password };
      if(document.getElementById("auth-section")) document.getElementById("auth-section").style.display="none";
      if(document.getElementById("user-section")) document.getElementById("user-section").style.display="block";
      updateCreditsDisplay();
      loadPortfolio();
    }
  } catch(err){ alert(err.message); }
}

function logOut(){
  auth.signOut();
  currentUser = null;
  if(document.getElementById("auth-section")) document.getElementById("auth-section").style.display="block";
  if(document.getElementById("user-section")) document.getElementById("user-section").style.display="none";
  if(document.getElementById("portfolioList")) document.getElementById("portfolioList").innerHTML='';
}

// ------------------ INVESTMENT FUNCTIONS ------------------
function updateCreditsDisplay(){ if(currentUser && document.getElementById("credits")) document.getElementById("credits").innerText = currentUser.credits; }

async function investFromSearch(artistName){
  let amount = parseInt(document.getElementById("investAmountSearch").value);
  if(!currentUser || !artistName || !amount){ alert("Enter artist and amount."); return; }

  const fee = Math.ceil(amount * 0.02);
  const total = amount + fee;

  const userRef = db.collection("users").doc(currentUser.uid);
  const userDoc = await userRef.get();
  const userData = userDoc.data();

  if(userData.credits < total){ alert("Not enough credits!"); return; }

  const newInvestment = { artistName, creditsInvested: amount, time: Date.now() };
  await userRef.update({ credits: userData.credits - total, portfolio: firebase.firestore.FieldValue.arrayUnion(newInvestment) });

  alert(`Invested ${amount} credits in ${artistName} (Fee: ${fee})`);
  logIn();
  document.getElementById("artistInfo").innerHTML = "";
}

// ------------------ PORTFOLIO PAGE ------------------
async function loadPortfolio(){
  if(!currentUser || !document.getElementById("portfolioList")) return;

  const userDoc = await db.collection("users").doc(currentUser.uid).get();
  const portfolio = userDoc.data().portfolio || [];
  const list = document.getElementById("portfolioList");
  list.innerHTML='';

  if(portfolio.length === 0){ list.innerHTML="<li>No investments yet.</li>"; return; }

  const grouped = {};
  portfolio.forEach(inv => { if(!grouped[inv.artistName]) grouped[inv.artistName]=0; grouped[inv.artistName]+=inv.creditsInvested; });
  for(const artist in grouped){
    const li=document.createElement("li");
    li.textContent=`${artist}: ${grouped[artist]} credits invested`;
    list.appendChild(li);
  }
}

// ------------------ RECORDS PAGE ------------------
async function loadRecords(){
  if(!document.getElementById("recordsList")) return;

  const usersSnapshot = await db.collection("users").get();
  const artistTotals={};

  usersSnapshot.forEach(userDoc=>{
    const portfolio = userDoc.data().portfolio || [];
    portfolio.forEach(inv=>{
      if(!artistTotals[inv.artistName]) artistTotals[inv.artistName]=0;
      artistTotals[inv.artistName]+=inv.creditsInvested;
    });
  });

  const sortedArtists=Object.entries(artistTotals).sort((a,b)=>b[1]-a[1]);
  const list=document.getElementById("recordsList");
  list.innerHTML='';

  if(sortedArtists.length===0){ list.innerHTML="<li>No investments yet.</li>"; return; }

  sortedArtists.forEach(([artist,total])=>{
    const li=document.createElement("li");
    li.textContent=`${artist}: ${total} total credits invested`;
    list.appendChild(li);
  });
}

// ------------------ PLACEHOLDER SEARCH ------------------
function searchArtist(){
  const artistName=document.getElementById("searchArtist").value.trim();
  const infoDiv=document.getElementById("artistInfo");
  infoDiv.innerHTML='';
  if(!artistName){ alert("Enter an artist name."); return; }

  const artistCard=document.createElement("div");
  artistCard.innerHTML=`
    <p><strong>${artistName}</strong></p>
    <p>Monthly Listeners: N/A</p>
    <input type="number" id="investAmountSearch" placeholder="Credits to invest">
    <button onclick="investFromSearch('${artistName}')">Invest</button>
  `;
  infoDiv.appendChild(artistCard);
}

// ------------------ PAGE LOAD ------------------
window.addEventListener('DOMContentLoaded',()=>{
  if(document.getElementById("recordsList")){
    auth.onAuthStateChanged(user=>{
      if(user) loadRecords();
    });
  }
});
