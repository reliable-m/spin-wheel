import { getDatabase, ref, set, onValue, runTransaction } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

(function() {
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

  // ----- Firebase reference -----
  const db = window.firebaseDatabase;  // set in index.html
  const stateRef = ref(db, 'spinState');

  // ----- load initial state & listen for changes -----
  onValue(stateRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      remainingNames = data.remainingNames || [];
      lastWinner = data.lastWinner || null;
    } else {
      // First visit – initialize with shuffled list
      const shuffled = shuffleArray([...originalNames]);
      set(stateRef, { remainingNames: shuffled, lastWinner: null });
      return;
    }

    // Update UI
    if (lastWinner) {
      wheelDisplay.innerText = lastWinner;
      resultDiv.innerText = `${lastWinner} You won the previous draw, thank you for your services. Time for a new winner`;
    } else {
      wheelDisplay.innerText = '🎰';
      resultDiv.innerText = '';
    }
    updateRemainingDisplay();
  });

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

  // ----- spin logic using Firebase transaction -----
  function initiateSpin() {
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

    spinTimeout = setTimeout(() => {
      clearInterval(spinInterval);
      wheel.classList.remove("spin-animation");

      // Atomically update the database
      runTransaction(stateRef, (currentData) => {
        if (currentData === null) {
          return {
            remainingNames: shuffleArray([...originalNames]),
            lastWinner: null
          };
        }
        let { remainingNames, lastWinner } = currentData;
        if (!remainingNames || remainingNames.length === 0) {
          remainingNames = shuffleArray([...originalNames]);
        }
        const randomIndex = Math.floor(Math.random() * remainingNames.length);
        const winner = remainingNames.splice(randomIndex, 1)[0];
        lastWinner = winner;
        return { remainingNames, lastWinner };
      }).then((result) => {
        if (result.committed) {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            startVelocity: 25,
            colors: ['#f6e05e', '#fbbf24', '#f59e0b', '#ff6b6b', '#48dbfb', '#1dd1a1']
          });
        }
      }).catch((error) => {
        console.error('Transaction failed:', error);
      }).finally(() => {
        isSpinning = false;
        spinBtn.disabled = false;
      });
    }, 2000);
  }

  // ----- event listeners -----
  spinBtn.addEventListener('click', initiateSpin);

  // double‑click anywhere to reset the global list
  document.addEventListener('dblclick', function() {
    const shuffled = shuffleArray([...originalNames]);
    set(stateRef, { remainingNames: shuffled, lastWinner: null });
    // stop any ongoing spin
    if (spinInterval) clearInterval(spinInterval);
    if (spinTimeout) clearTimeout(spinTimeout);
    wheel.classList.remove("spin-animation");
    isSpinning = false;
    spinBtn.disabled = false;
    confetti({ particleCount: 50, spread: 40, origin: { y: 0.5 } });
  });
})();