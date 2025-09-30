// ----- Portfolio (shared with other pages if needed) -----
let userPortfolio = {}; // key: artistId, value: {name, credits}
let userCredits = 10000;

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

  const resultsDiv = document.getElementById("artist-results");
  resultsDiv.innerHTML = `<p>Loading...</p>`;

  try {
    const token = await getToken();
    const resp = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=10`, {
      headers: { "Authorization": "Bearer " + token }
    });
    const data = await resp.json();

    resultsDiv.innerHTML = "";
    if (!data.artists.items.length) {
      resultsDiv.innerHTML = "<p>No artists found.</p>";
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
  } catch (err) {
    resultsDiv.innerHTML = "<p>Error fetching artists. Try again later.</p>";
    console.error(err);
  }
}

// ----- Investing -----
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

  alert(`Invested ${investAmount} credits in ${artistName}!`);
}
