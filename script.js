(function() {
  // ----- constants & state -----
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

  const STORAGE_KEY = 'vibecodeSpinState';

  // persistence helpers
  function saveState() {
    const state = {
      remainingNames: remainingNames,
      lastWinner: lastWinner
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        remainingNames = state.remainingNames || [];
        lastWinner = state.lastWinner || null;
      } catch (e) {
        resetList();
      }
    } else {
      resetList();
    }
  }

  // array helpers
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function resetList() {
    remainingNames = [...originalNames];
    remainingNames = shuffleArray(remainingNames);
    lastWinner = null;
    saveState();
  }

  function updateRemainingDisplay() {
    remainingSpan.innerText = `${remainingNames.length} remaining`;
  }

  // spin logic
  function stopSpinAndPickWinner() {
    if (spinInterval) {
      clearInterval(spinInterval);
      spinInterval = null;
    }
    if (spinTimeout) {
      clearTimeout(spinTimeout);
      spinTimeout = null;
    }
    wheel.classList.remove("spin-animation");

    if (remainingNames.length === 0) {
      resetList();
    }

    const randomIndex = Math.floor(Math.random() * remainingNames.length);
    const winner = remainingNames.splice(randomIndex, 1)[0];
    lastWinner = winner;
    saveState();

    wheelDisplay.innerText = winner;
    resultDiv.innerText = `Congradulations🥳🥳 ${winner} you are giving us our next project`;
    resultDiv.classList.add("winner-animation");
    setTimeout(() => resultDiv.classList.remove("winner-animation"), 600);

    // confetti celebration
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
  }

  function initiateSpin() {
    if (isSpinning) return;

    if (spinInterval) clearInterval(spinInterval);
    if (spinTimeout) clearTimeout(spinTimeout);

    isSpinning = true;
    spinBtn.disabled = true;

    resultDiv.innerText = "";
    resultDiv.classList.remove("winner-animation");

    wheel.classList.add("spin-animation");

    spinInterval = setInterval(() => {
      const randomName = originalNames[Math.floor(Math.random() * originalNames.length)];
      wheelDisplay.innerText = randomName;
    }, 60);

    spinTimeout = setTimeout(() => {
      stopSpinAndPickWinner();
    }, 2000);
  }

  // initial load
  loadState();

  if (lastWinner) {
    wheelDisplay.innerText = lastWinner;
    resultDiv.innerText = `${lastWinner} You won the previous draw, thank you for your services. Time for a new winner`;
  } else {
    wheelDisplay.innerText = '🎰';
    resultDiv.innerText = '';
  }
  updateRemainingDisplay();

  // event listeners 
  spinBtn.addEventListener('click', initiateSpin);

  // double‑click anywhere to reset (fun hidden feature)
  document.addEventListener('dblclick', function() {
    resetList();
    updateRemainingDisplay();
    wheelDisplay.innerText = '🎰';
    resultDiv.innerText = '';
    if (spinInterval || spinTimeout) {
      clearInterval(spinInterval);
      clearTimeout(spinTimeout);
      wheel.classList.remove("spin-animation");
      isSpinning = false;
      spinBtn.disabled = false;
    }
    confetti({ particleCount: 50, spread: 40, origin: { y: 0.5 } });
  });
})();