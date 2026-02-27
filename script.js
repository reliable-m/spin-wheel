(function() {
  // ----- jsonblob.com configuration -----
  // ✅ CORRECT API URL (includes /api/jsonblob/)
  const BLOB_URL = "https://jsonblob.com/api/jsonblob/019ca071-7271-7255-9aed-50402382d337";

  // ----- constants -----
  const originalNames = ["Tshepo", "Phindile", "Lelo", "Reliable", "Chichi", "Zandile", "Ntando"];
  let remainingNames = [];
  let lastWinner = null;
  let isSpinning = false;
  let spinInterval = null;
  let spinTimeout = null;

  // ----- DOM elements -----
  const wheelDisplay = document.getElementById("wheelDisplay");
  const resultDiv = document.getElementById("result");
  const spinBtn = document.getElementById("spinButton");
  const wheel = document.getElementById("wheel");
  const remainingSpan = document.getElementById("remainingCounter");

  // ----- helpers -----
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function updateRemainingDisplay() {
    remainingSpan.innerText = `${remainingNames.length} remaining`;
  }

  // ----- load state from jsonblob.com -----
  async function loadState() {
    console.log("Loading state from:", BLOB_URL);
    try {
      const response = await fetch(BLOB_URL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Loaded data:", data);
      remainingNames = data.remainingNames || [];
      lastWinner = data.lastWinner || null;

      if (lastWinner) {
        wheelDisplay.innerText = lastWinner;
        resultDiv.innerText = `${lastWinner} You won the previous draw, thank you for your services. Time for a new winner`;
      } else {
        wheelDisplay.innerText = '🎰';
        resultDiv.innerText = '';
      }
      updateRemainingDisplay();
    } catch (error) {
      console.error("Failed to load state:", error);
      // fallback to local reset
      resetLocalList();
      updateRemainingDisplay();
    }
  }

  // ----- save state to jsonblob.com -----
  async function saveState() {
    console.log("Saving state:", { remainingNames, lastWinner });
    try {
      const response = await fetch(BLOB_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remainingNames: remainingNames,
          lastWinner: lastWinner
        })
      });
      if (!response.ok) {
        console.error("Save failed with status:", response.status);
        const text = await response.text();
        console.error("Response body:", text);
      } else {
        console.log("Save successful");
      }
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  }

  // ----- reset list (local helper) -----
  function resetLocalList() {
    remainingNames = shuffleArray([...originalNames]);
    lastWinner = null;
  }

  // ----- spin logic -----
  async function initiateSpin() {
    if (isSpinning) return;

    isSpinning = true;
    spinBtn.disabled = true;

    resultDiv.innerText = "";
    resultDiv.classList.remove("winner-animation");

    wheel.classList.add("spin-animation");

    // flicker random names
    spinInterval = setInterval(() => {
      const randomName = originalNames[Math.floor(Math.random() * originalNames.length)];
      wheelDisplay.innerText = randomName;
    }, 60);

    spinTimeout = setTimeout(async () => {
      clearInterval(spinInterval);
      wheel.classList.remove("spin-animation");

      // Refresh state from server (in case someone else spun)
      try {
        const response = await fetch(BLOB_URL);
        if (response.ok) {
          const data = await response.json();
          remainingNames = data.remainingNames || [];
          lastWinner = data.lastWinner || null;
          console.log("Refreshed state before spin:", { remainingNames, lastWinner });
        } else {
          console.warn("Could not refresh, status:", response.status);
        }
      } catch (error) {
        console.warn("Could not refresh state, using local copy");
      }

      // If no names left, reset
      if (remainingNames.length === 0) {
        console.log("No names left, resetting list");
        remainingNames = shuffleArray([...originalNames]);
      }

      // Pick a winner
      const randomIndex = Math.floor(Math.random() * remainingNames.length);
      const winner = remainingNames.splice(randomIndex, 1)[0];
      lastWinner = winner;
      console.log("New winner:", winner);

      // Save to jsonblob.com
      await saveState();

      // Update UI
      wheelDisplay.innerText = winner;
      resultDiv.innerText = `Congratulations 🥳🥳 ${winner} you are giving us our next project`;
      resultDiv.classList.add("winner-animation");
      setTimeout(() => resultDiv.classList.remove("winner-animation"), 600);

      // Confetti
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        startVelocity: 25,
        colors: ['#f6e05e', '#fbbf24', '#f59e0b', '#ff6b6b', '#48dbfb', '#1dd1a1']
      });

      updateRemainingDisplay();
      isSpinning = false;
      spinBtn.disabled = false;
    }, 2000);
  }

  // ----- reset (double‑click anywhere) -----
  document.addEventListener('dblclick', async function() {
    console.log("Double-click detected, resetting list");
    resetLocalList();
    await saveState();
    wheelDisplay.innerText = '🎰';
    resultDiv.innerText = '';
    updateRemainingDisplay();
    if (spinInterval) clearInterval(spinInterval);
    if (spinTimeout) clearTimeout(spinTimeout);
    wheel.classList.remove("spin-animation");
    isSpinning = false;
    spinBtn.disabled = false;
    confetti({ particleCount: 50, spread: 40, origin: { y: 0.5 } });
  });

  // ----- initial load -----
  loadState();

  // ----- event listener for spin button -----
  spinBtn.addEventListener('click', initiateSpin);
})();