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
  } catch (err) {
    alert(err.message);
  }
}

auth.onAuthStateChanged(user => {
  if (user) {
    console.log("Logged in as:", user.email);
    document.getElementById("auth-section").style.display = "none";
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

async function searchArtist() {
  const name = document.getElementById("search-input").value;
  const token = await getToken();
  const resp = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1`, {
    headers: { "Authorization": "Bearer " + token }
  });
  const data = await resp.json();
  if (!data.artists.items.length) {
    document.getElementById("artist-results").innerHTML = "Artist not found";
    return;
  }
  const artist = data.artists.items[0];
  document.getElementById("artist-results").innerHTML = `
    <img src="${artist.images[0]?.url || ''}" alt="${artist.name}">
    <p>${artist.name}</p>
    <p>Followers: ${artist.followers.total}</p>
  `;
}
