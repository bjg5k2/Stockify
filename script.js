// 🔐 Your Spotify Client ID and Secret (keep repo private!)
const clientId = "b0450273fe7d41a08cc3ea93a2e733ae";
const clientSecret = "5b22a59a771b4f8885f887958bfddeb2";

let accessToken = "";
let portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];

// --- Get Access Token ---
async function getAccessToken() {
  const result = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Basic " + btoa(clientId + ":" + clientSecret),
    },
    body: "grant_type=client_credentials",
  });
  const data = await result.json();
  accessToken = data.access_token;
}

// --- Search Artist ---
async function searchArtist() {
  const query = document.getElementById("searchInput").value;
  if (!query) return;
  if (!accessToken) await getAccessToken();

  const result = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist`,
    { headers: { Authorization: "Bearer " + accessToken } }
  );

  const data = await result.json();
  displayResults(data.artists.items);
}

// --- Display Search Results ---
function displayResults(artists) {
  const container = document.getElementById("searchResults");
  if (!container) return;
  container.innerHTML = "";

  if (!artists || artists.length === 0) {
    container.innerHTML = "<p>No results found.</p>";
    return;
  }

  artists.forEach((artist) => {
    const card = document.createElement("div");
    card.className = "artist-card";

    const info = document.createElement("div");
    info.className = "artist-info";

    const img = document.createElement("img");
    img.src = artist.images[0]?.url || "https://via.placeholder.com/64";
    img.alt = artist.name;

    const text = document.createElement("div");
    text.innerHTML = `<strong>${artist.name}</strong><br>
                      Followers: ${artist.followers.total.toLocaleString()}`;

    info.appendChild(img);
    info.appendChild(text);

    const investBtn = document.createElement("button");
    investBtn.innerText = "Invest 100 credits";
    investBtn.onclick = () => investInArtist(artist);

    card.appendChild(info);
    card.appendChild(investBtn);
    container.appendChild(card);
  });
}

// --- Invest ---
function investInArtist(artist) {
  const investment = {
    name: artist.name,
    followers: artist.followers.total,
    credits: 100,
    time: Date.now(),
  };
  portfolio.push(investment);
  localStorage.setItem("portfolio", JSON.stringify(portfolio));
  updatePortfolio();
  updateRecords();
}

// --- Update Portfolio ---
function updatePortfolio() {
  const list = document.getElementById("portfolioList");
  if (!list) return;

  list.innerHTML = "";
  portfolio.forEach((item) => {
    const li = document.createElement("li");
    li.innerText = `${item.credits} credits in ${item.name} (Followers: ${item.followers.toLocaleString()})`;
    list.appendChild(li);
  });
}

// --- Update Records ---
function updateRecords() {
  const topCtx = document.getElementById("topCreditsChart")?.getContext("2d");
  const recentCtx = document.getElementById("recentInvestmentsChart")?.getContext("2d");

  if (!topCtx || !recentCtx) return;
  if (portfolio.length === 0) return;

  // Top credits
  const grouped = {};
  portfolio.forEach((p) => {
    if (!grouped[p.name]) grouped[p.name] = 
