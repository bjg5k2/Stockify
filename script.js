let currentUser = null;

// Sign Up
async function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    await db.collection("users").doc(user.uid).set({
      credits: 10000,
      portfolio: []
    });

    alert("Account created! You have 10,000 credits.");
    logIn();
  } catch (err) {
    alert(err.message);
  }
}

// Log In
async function logIn() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    const doc = await db.collection("users").doc(user.uid).get();
    if (doc.exists) {
      currentUser = { uid: user.uid, ...doc.data(), email, password };
      document.getElementById("auth-section").style.display = "none";
      document.getElementById("user-section").style.display = "block";
      updateCreditsDisplay();
    }
  } catch (err) {
    alert(err.message);
  }
}

// Log Out
function logOut() {
  auth.signOut();
  currentUser = null;
  document.getElementById("auth-section").style.display = "block";
  document.getElementById("user-section").style.display = "none";
}

// Update Credits Display
function updateCreditsDisplay() {
  if (currentUser) {
    document.getElementById("credits").innerText = currentUser.credits;
  }
}

// Invest Credits
async function invest() {
  const artistName = document.getElementById("artistName").value;
  let amount = parseInt(document.getElementById("investAmount").value);

  if (!currentUser || !artistName || !amount) {
    alert("Enter artist and amount.");
    return;
  }

  const fee = Math.ceil(amount * 0.02);
  const total = amount + fee;

  const userRef = db.collection("users").doc(currentUser.uid);
  const userDoc = await userRef.get();
  const userData = userDoc.data();

  if (userData.credits < total) {
    alert("Not enough credits!");
    return;
  }

  const newInvestment = {
    artistName,
    creditsInvested: amount,
    time: Date.now()
  };

  await userRef.update({
    credits: userData.credits - total,
    portfolio: firebase.firestore.FieldValue.arrayUnion(newInvestment)
  });

  alert(`Invested ${amount} credits in ${artistName} (Fee: ${fee})`);
  logIn(); // Refresh user data
}
