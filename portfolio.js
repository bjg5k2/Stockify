// In-memory portfolio data
let userPortfolio = {}; // key: artistId, value: {name, credits}
let userCredits = 10000;

// Update portfolio display
function updatePortfolioUI() {
  const portfolioDiv = document.getElementById("portfolio-list");
  portfolioDiv.innerHTML = "";

  const creditsSpan = document.getElementById("user-credits");
  creditsSpan.textContent = userCredits;

  if (Object.keys(userPortfolio).length === 0) {
    portfolioDiv.innerHTML = "<p>No investments yet.</p>";
    return;
  }

  for (const id in userPortfolio) {
    const artist = userPortfolio[id];
    const div = document.createElement("div");
    div.className = "portfolio-card";
    div.innerHTML = `<p><strong>${artist.name}</strong>: ${artist.credits} credits invested</p>`;
    portfolioDiv.appendChild(div);
  }
}

// Top performers (for Home page)
function updateTopPerformers() {
  const topDiv = document.getElementById("top-list");
  if (!topDiv) return;

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
    div.innerHTML = `<p><strong>${artist.name}</strong>: ${artist.credits} credits</p>`;
    topDiv.appendChild(div);
  });
}

// Example invest function (can be called from trade.js)
function invest(artistId, artistName, amount) {
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
  alert(`Invested ${investAmount} credits in ${artistName}!`);
}

// Initialize UI
updatePortfolioUI();
updateTopPerformers();
