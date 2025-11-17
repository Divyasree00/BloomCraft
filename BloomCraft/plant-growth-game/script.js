import {
  initPlayer,
  createRoom,
  updateRoomPlayerData,
  subscribeRoom,
  markGameStarted,
} from "./firebase.js";

const REQUIRED_ELEMENTS = ["sun", "water", "soil", "food"];
const MAX_STAGE = 6;

// DOM ELEMENTS
const setupScreen = document.getElementById("setup-screen");
const playerNameInput = document.getElementById("player-name");
const createRoomBtn = document.getElementById("create-room-btn");
const joinRoomBtn = document.getElementById("join-room-btn");
const joinCodeInput = document.getElementById("join-code");
const roomLinkDisplay = document.getElementById("room-link-display");

const statusEl = document.getElementById("status");
const roomInfoEl = document.getElementById("room-info");
const myNameEl = document.getElementById("my-player-name");
const oppNameEl = document.getElementById("opp-player-name");
const myPlantImg = document.getElementById("my-plant");
const oppPlantImg = document.getElementById("opp-plant");
const elementButtons = Array.from(document.querySelectorAll(".element"));
const plantSelect = document.getElementById("flower-select");

let playerName = "";
let roomId = null;
let playerId = null;
let gameStarted = false;
let winnerBanner = false;
let isHost = false;

let myState = { currentStage: 1, collectedElements: [], completedAt: null };
let oppState = { currentStage: 1, collectedElements: [], completedAt: null };
let myPlantType = "lotus";
let oppPlantType = "lotus";

const stageToSrc = {
  lotus: Object.fromEntries(
    [...Array(6)].map((_, i) => [i + 1, `assets/lotus_growth_stages/lotus_stage${i + 1}.svg`])
  ),
  rose: Object.fromEntries(
    [...Array(6)].map((_, i) => [i + 1, `assets/rose_growth_stages/rose_stage${i + 1}.svg`])
  ),
  sunflower: Object.fromEntries(
    [...Array(6)].map((_, i) => [i + 1, `assets/sunflower_growth_stages/sunflower_stage${i + 1}.svg`])
  ),
};

// Helper
function getOrCreatePlayerId() {
  let pid = localStorage.getItem("bloomcraft-player-id");
  if (!pid) {
    pid = `p_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
    localStorage.setItem("bloomcraft-player-id", pid);
  }
  return pid;
}

/* ---------------- SETUP ROOM LISTENER ---------------- */
function setupRoomListener() {
  console.log("🎧 Setting up room listener for:", roomId);
  
  subscribeRoom(roomId, (playersMap) => {
    if (!playersMap) {
      console.log("⚠️ No room data received");
      return;
    }
    
    console.log("📡 Room update received:", {
      keys: Object.keys(playersMap),
      data: playersMap
    });

    // Handle game start
    if (playersMap.gameStarted && playersMap.startedAt && !gameStarted) {
      console.log("🚀 Game starting!");
      gameStarted = true;
      const delay = playersMap.startedAt + 2000 - Date.now();
      setupScreen.style.display = "none";
      setTimeout(() => startGame(), delay > 0 ? delay : 0);
      return;
    }

    // If game already started, skip lobby logic
    if (gameStarted) return;

    // HOST ONLY: Check for opponent and enable start button
    if (isHost) {
      const allPlayerIds = Object.keys(playersMap).filter(key => key.startsWith('p_'));
      const oppId = allPlayerIds.find(id => id !== playerId);
      
      console.log("👥 Host sees players:", allPlayerIds);
      
      const waitingText = document.getElementById("waiting-text");
      const startButton = document.getElementById("start-btn");
      
      if (waitingText && startButton) {
        if (oppId && playersMap[oppId]?.playerName) {
          const oppName = playersMap[oppId].playerName;
          console.log("✅ OPPONENT DETECTED:", oppName);
          waitingText.textContent = `✅ Opponent joined: ${oppName}!`;
          waitingText.style.color = "#4ade80";
          startButton.disabled = false;
          startButton.style.opacity = "1";
          startButton.style.cursor = "pointer";
          startButton.style.background = "#10b981";
        } else {
          console.log(`⏳ Waiting... (${allPlayerIds.length}/2)`);
          waitingText.textContent = `⏳ Waiting for opponent... (${allPlayerIds.length}/2 players)`;
          startButton.disabled = true;
          startButton.style.opacity = "0.6";
          startButton.style.cursor = "not-allowed";
        }
      }
    }
  });
}

/* ---------------- CREATE ROOM ---------------- */
createRoomBtn.addEventListener("click", async () => {
  try {
    playerName = playerNameInput.value.trim();
    if (!playerName) return alert("Please enter your name 🌿");

    isHost = true;
    playerId = getOrCreatePlayerId();
    await initPlayer(playerId);

    roomId = `room_${Math.random().toString(36).slice(2, 8)}`;
    
    console.log("🌸 Creating room:", roomId, "as player:", playerId);
    
    await createRoom(roomId, playerId, {
      playerName,
      selectedPlant: myPlantType,
      currentStage: 1,
      collectedElements: [],
      completedAt: null,
      createdAt: Date.now(),
    });

    const joinLink = `${window.location.origin}?room=${roomId}`;
    roomLinkDisplay.innerHTML = `
      <div style="background: rgba(255,255,255,0.08); padding: 12px 16px; border-radius: 10px; margin-top: 15px;">
        <h3 style="color:#b983ff;margin:0;">🌸 Room Created!</h3>
        <p style="margin:6px 0;">Code: <strong style="color:#ffb6ff">${roomId}</strong></p>
        <p style="margin:4px 0;font-size:0.85rem;">Share this with your friend:</p>
        <div style="background:rgba(0,0,0,0.3);padding:8px;border-radius:6px;margin:8px 0;word-break:break-all;">
          <a href="${joinLink}" target="_blank" style="color:#b983ff;text-decoration:none;font-size:0.9rem;">${joinLink}</a>
        </div>
        <button id="copy-link-btn" style="padding:8px 16px;border:none;border-radius:6px;background:#b983ff;color:white;cursor:pointer;font-weight:600;margin-bottom:12px;">📋 Copy Room Link</button>
        <p id="waiting-text" style="margin-top:12px;color:#fbbf24;font-size:1rem;font-weight:600;">⏳ Waiting for opponent...</p>
        <button id="start-btn" style="margin-top:12px;padding:10px 24px;border:none;border-radius:8px;background:#8b5cf6;color:white;font-weight:700;cursor:not-allowed;opacity:0.6;font-size:1rem;" disabled>Start Game</button>
      </div>
    `;

    const copyLinkBtn = document.getElementById("copy-link-btn");
    copyLinkBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(joinLink);
        copyLinkBtn.textContent = "✅ Copied!";
        copyLinkBtn.style.background = "#10b981";
        setTimeout(() => {
          copyLinkBtn.textContent = "📋 Copy Room Link";
          copyLinkBtn.style.background = "#b983ff";
        }, 2000);
      } catch (err) {
        alert("Failed to copy. Please copy manually.");
      }
    });

    const startBtn = document.getElementById("start-btn");
    startBtn.onclick = async () => {
      if (startBtn.disabled) return;
      console.log("🎮 Host clicked Start Game");
      startBtn.disabled = true;
      startBtn.textContent = "🌱 Starting...";
      await markGameStarted(roomId);
    };

    // Start listening for room updates
    setupRoomListener();

    console.log("✅ Room setup complete, listening for opponent...");
  } catch (err) {
    console.error("❌ Create room error:", err);
    alert("Could not create room – check console.");
  }
});

/* ---------------- JOIN ROOM ---------------- */
joinRoomBtn.addEventListener("click", async () => {
  try {
    playerName = playerNameInput.value.trim();
    const joinCode = joinCodeInput.value.trim();
    if (!playerName) return alert("Please enter your name 🌿");
    if (!joinCode) return alert("Enter room code!");

    isHost = false;
    playerId = getOrCreatePlayerId();
    await initPlayer(playerId);
    roomId = joinCode.startsWith("room_") ? joinCode : `room_${joinCode}`;

    console.log("🚪 Joining room:", roomId, "as player:", playerId);

    await updateRoomPlayerData(roomId, playerId, {
      playerName,
      selectedPlant: myPlantType,
      currentStage: 1,
      collectedElements: [],
      completedAt: null,
      joinedAt: Date.now(),
    });

    // Show waiting message
    roomLinkDisplay.innerHTML = `
      <div style="background: rgba(255,255,255,0.08); padding: 12px 16px; border-radius: 10px; margin-top: 15px;">
        <h3 style="color:#10b981;margin:0;">✅ Joined Room!</h3>
        <p style="margin:10px 0;color:#bbb;">Waiting for host to start the game...</p>
      </div>
    `;

    // Start listening for game start
    setupRoomListener();

    console.log("✅ Joined room successfully, waiting for host to start...");
  } catch (err) {
    console.error("❌ Join room error:", err);
    alert("Could not join room – check console.");
  }
});

/* ---------------- GAME START ---------------- */
function startGame() {
  console.log("🎮 Game starting!");
  roomInfoEl.textContent = `Room: ${roomId}`;
  myNameEl.textContent = `${playerName} (You)`;

  // Track previous stages to detect changes
  let lastMyStage = myState.currentStage || 1;
  let lastOppStage = oppState.currentStage || 1;

  subscribeRoom(roomId, (players) => {
    if (!players) return;

    const myData = players[playerId] || {};
    const oppEntry = Object.entries(players).find(([id]) => id !== playerId && id.startsWith('p_'));
    const oppData = oppEntry ? oppEntry[1] : null;

    // --- Update opponent name ---
    if (oppData) oppNameEl.textContent = oppData.playerName || "Opponent";

    // --- Check if both players are ready to restart ---
    if (myData.readyForRestart && oppData?.readyForRestart) {
      console.log("🔄 Both players ready, restarting game...");
      
      // Only trigger restart once
      if (winnerBanner) {
        winnerBanner = false;
        
        // Hide winner screen
        const winnerScreen = document.getElementById("winner-screen");
        winnerScreen.classList.add("hidden");
        
        // Reset local states
        myState = { currentStage: 1, collectedElements: [], completedAt: null };
        oppState = { currentStage: 1, collectedElements: [], completedAt: null };
        lastMyStage = 1;
        lastOppStage = 1;
        
        // Reset plant images
        setPlantImage(myPlantImg, 1, myPlantType);
        setPlantImage(oppPlantImg, 1, oppPlantType);
        updateStatus(1);
        
        // Clear ready flags
        updateRoomPlayerData(roomId, playerId, { 
          readyForRestart: false,
          currentStage: 1,
          collectedElements: [],
          completedAt: null
        });
        
        // Start new game countdown
        setTimeout(() => startCountdown(), 500);
      }
      
      return;
    }

    // --- Detect and animate my plant growth ---
    if (myData.currentStage && myData.currentStage !== lastMyStage) {
      setPlantImage(myPlantImg, myData.currentStage, myData.selectedPlant || myPlantType);
      animateStageAdvance(true);
      updateStatus(myData.currentStage);
      lastMyStage = myData.currentStage;
    }

    // --- Detect and animate opponent plant growth ---
    if (oppData && oppData.currentStage && oppData.currentStage !== lastOppStage) {
      setPlantImage(oppPlantImg, oppData.currentStage, oppData.selectedPlant || oppPlantType);
      animateStageAdvance(false);
      lastOppStage = oppData.currentStage;
    }

    // --- Update local state ---
    if (myData) syncLocalFromDb(myData, true);
    if (oppData) syncLocalFromDb(oppData, false);

    maybeAnnounceWinner();
  });

  setupFlowerSelection();
  setupElementButtons();

  // 🎬 Start countdown for both players
  startCountdown();
}

/* ---------------- FLOWER / ELEMENTS ---------------- */
function setupFlowerSelection() {
  plantSelect.addEventListener("change", async (e) => {
    myPlantType = e.target.value;
    myState.currentStage = 1;
    setPlantImage(myPlantImg, 1, myPlantType);
    updateStatus(1);
    if (roomId && playerId) {
      await updateRoomPlayerData(roomId, playerId, {
        selectedPlant: myPlantType,
        currentStage: 1,
        collectedElements: [],
        completedAt: null,
      });
    }
  });
}

function setupElementButtons() {
  elementButtons.forEach((btn) =>
    btn.addEventListener("click", async () => {
      const element = btn.dataset.element;
      await handleCollect(element);
      flashButton(btn);
    })
  );
}

/* ---------------- GAME LOGIC ---------------- */
async function handleCollect(el) {
  if (myState.currentStage >= MAX_STAGE) return;
  const set = new Set(myState.collectedElements);
  set.add(el);
  myState.collectedElements = [...set];
  animateElementCollect(el);

  if (REQUIRED_ELEMENTS.every((e) => set.has(e))) {
    const nextStage = Math.min(MAX_STAGE, myState.currentStage + 1);
    const nextData = {
      currentStage: nextStage,
      collectedElements: [],
      selectedPlant: myPlantType,
    };
    if (nextStage === MAX_STAGE) nextData.completedAt = Date.now();
    myState = { ...myState, ...nextData };
    if (roomId && playerId) await updateRoomPlayerData(roomId, playerId, nextData);
    setPlantImage(myPlantImg, nextStage, myPlantType);
    updateStatus(nextStage);
  }
}

/* ---------------- VISUAL HELPERS ---------------- */
function animateStageAdvance(isMe) {
  const img = isMe ? myPlantImg : oppPlantImg;
  if (!img) return;
  gsap.fromTo(
    img,
    { scale: 0.9, opacity: 0.3 },
    { scale: 1, opacity: 1, duration: 1 }
  );
  // ✨ Glow effect
  gsap.to(img, {
    boxShadow: "0 0 40px #b983ff",
    duration: 0.4,
    yoyo: true,
    repeat: 1,
  });
}

function animateElementCollect(element) {
  const btn = elementButtons.find(b => b.dataset.element === element);
  if (!btn) return;
  gsap.to(btn, {
    scale: 1.1,
    duration: 0.2,
    yoyo: true,
    repeat: 1
  });
}

function flashButton(btn) {
  btn.classList.add("active");
  setTimeout(() => btn.classList.remove("active"), 300);
}

function setPlantImage(img, stage, plantType) {
  if (!img || !stage || !plantType) return;
  const src = stageToSrc[plantType]?.[stage];
  if (src) img.src = src;
}

function updateStatus(stage) {
  if (stage >= MAX_STAGE) {
    statusEl.textContent = "🌺 Fully bloomed!";
  } else {
    statusEl.textContent = `Stage ${stage}: Collecting elements...`;
  }
}

/* ---------------- COUNTDOWN ---------------- */
function startCountdown() {
  const div = document.createElement("div");
  Object.assign(div.style, {
    position: "fixed",
    inset: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "5rem",
    fontWeight: "800",
    color: "#fff",
    background: "rgba(0,0,0,0.6)",
    zIndex: "999",
  });
  document.body.appendChild(div);

  let n = 3;
  div.textContent = n;
  const interval = setInterval(() => {
    n--;
    if (n > 0) div.textContent = n;
    else {
      div.textContent = "🌸 Grow!";
      setTimeout(() => div.remove(), 1000);
      clearInterval(interval);
    }
  }, 1000);
}

/* ---------------- SYNC LOCAL STATE ---------------- */
function syncLocalFromDb(remote, isMe) {
  if (!remote) return;
  const target = isMe ? myState : oppState;
  target.currentStage = remote.currentStage || 1;
  target.collectedElements = remote.collectedElements || [];
  target.completedAt = remote.completedAt || null;
  target.selectedPlant = remote.selectedPlant || (isMe ? myPlantType : oppPlantType);
  
  if (isMe) {
    myPlantType = target.selectedPlant;
  } else {
    oppPlantType = target.selectedPlant;
  }
}

/* ---------------- WINNER LOGIC ---------------- */
function maybeAnnounceWinner() {
  if (winnerBanner) return;
  
  const myDone = myState.currentStage >= MAX_STAGE && myState.completedAt;
  const oppDone = oppState.currentStage >= MAX_STAGE && oppState.completedAt;
  
  if (!myDone && !oppDone) return;
  
  let winner = null;
  if (myDone && oppDone) {
    winner = myState.completedAt < oppState.completedAt ? "you" : "opponent";
  } else if (myDone) {
    winner = "you";
  } else if (oppDone) {
    winner = "opponent";
  }
  
  if (winner) {
    winnerBanner = true;
    showWinner(winner === "you");
  }
}

function showWinner(didIWin) {
  // ⏱️ Add 2 second delay before showing winner screen
  setTimeout(() => {
    const winnerScreen = document.getElementById("winner-screen");
    const winnerText = document.getElementById("winner-text");
    const playAgainBtn = document.getElementById("play-again-btn");
    
    if (didIWin) {
      winnerText.textContent = "🌼 You Won!";
    } else {
      winnerText.textContent = "🌺 Opponent Won!";
    }
    
    winnerScreen.classList.remove("hidden");
    
    // 🎊 Trigger confetti effect
    createConfetti();
    
    // Update button text to show waiting status
    playAgainBtn.textContent = "Play Again";
    playAgainBtn.disabled = false;
    
    playAgainBtn.onclick = async () => {
      playAgainBtn.disabled = true;
      playAgainBtn.textContent = "⏳ Waiting for opponent...";
      
      // Mark this player as ready
      await updateRoomPlayerData(roomId, playerId, {
        readyForRestart: true
      });
      
      console.log("🔄 Marked ready for restart, waiting for opponent...");
    };
  }, 2000);
}

// 🎊 Confetti Effect
function createConfetti() {
  const colors = ['#7cdaff', '#b983ff', '#9aff7a', '#ffb6ff', '#ffd700'];
  const confettiCount = 100;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 3 + 's';
    confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
    document.body.appendChild(confetti);
    
    // Remove confetti after animation
    setTimeout(() => confetti.remove(), 5000);
  }
}

/* ---------------- AUTO-JOIN FROM URL ---------------- */
window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const roomParam = params.get("room");
  if (roomParam) {
    joinCodeInput.value = roomParam;
  }
});