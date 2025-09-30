// ----- Track Portfolio -----
let userPortfolio = {}; // key: artistId, value: {name, credits}
let userCredits = 10000;

// ----- Page Navigation -----
function showPage(pageId) {
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
  if (!name) return alert("Enter an artist name");
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
      <button class="invest-btn" onclick="invest('${artist.id}','${artist.name}')">Invest</button>
    `;
    resultsDiv.appendChild(artistDiv);
  });
}

// ----- Portfolio / Investing -----
function initPortfolio() {
  updatePortfolioUI();
  updateTopPerformers();
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
  updateTopPerformers();
}

function updatePortfolioUI() {
  const portfolioDiv = document.getElementById("portfolio-list");
  portfolioDiv.innerHTML = `<p>Total Credits: ${userCredits}</p>`;
  for (const id in userPortfolio) {
    const artist = userPortfolio[id];
    const div = document.createElement("div");
    div.className = "portfolio-card";
    div.textContent = `${artist.name}: ${artist.credits} credits invested`;
    portfolioDiv.appendChild(div);
  }
}

// ----- Top Performers -----
function updateTopPerformers() {
  const topDiv = document.getElementById("top-list");
  topDiv.innerHTML = "";

  const sorted = Object.entries(userPortfolio)
    .sort((a,b) => b[1].credits - a[1].credits)
    .slice(0,5);

  if (sorted.length === 0) {
    topDiv.innerHTML = "<p>No investments yet.</p>";
    return;
  }

  sorted.forEach(([id, artist]) => {
    const div = document.createElement("div");
    div.className = "top-card";
    div.innerHTML = `<p><strong>${artist.name}</strong></p><p>Credits: ${artist.credits}</p>`;
    topDiv.appendChild(div);
  });
}

// Initialize
initPortfolio();
showPage("home");
