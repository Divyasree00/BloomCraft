import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue,
  get,
  child
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyB2d7Ew6yJkU9PvBrgYWnKfY7uT4O2NwjI",
  authDomain: "bloomcraft-79908.firebaseapp.com",
  databaseURL: "https://bloomcraft-79908-default-rtdb.firebaseio.com",
  projectId: "bloomcraft-79908",
  storageBucket: "bloomcraft-79908.appspot.com",
  messagingSenderId: "831681367916",
  appId: "1:831681367916:web:8f9be27e5455c32d4fa551"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* -------------------------------------------------
   PLAYER FUNCTIONS
--------------------------------------------------*/

// ✅ Initialize player (used by both host & joiner)
export async function initPlayer(playerId, name = "Unknown") {
  try {
    const playerRef = ref(db, `players/${playerId}`);
    await set(playerRef, {
      playerId,
      name,
      createdAt: Date.now()
    });
    console.log("🌿 Player initialized:", playerId);
  } catch (err) {
    console.error("❌ Failed to init player:", err);
  }
}

/* -------------------------------------------------
   ROOM FUNCTIONS
--------------------------------------------------*/

// ✅ Create a new room (host)
export async function createRoom(roomId, playerId, playerData) {
  try {
    const roomRef = ref(db, `rooms/${roomId}`);

    const existing = await get(roomRef);
    if (existing.exists()) {
      console.warn(`⚠️ Room ${roomId} already exists — reusing it.`);
    }

    await set(roomRef, {
      createdAt: Date.now(),
      gameStarted: false,
      startedAt: null,
      [playerId]: playerData
    });

    console.log("🌸 Room created successfully:", roomId);
  } catch (err) {
    console.error("❌ Failed to create room:", err);
  }
}

/* -------------------------------------------------
   PLAYER UPDATES INSIDE A ROOM
--------------------------------------------------*/

// ✅ Add or update player data in room
export async function updateRoomPlayerData(roomId, playerId, data) {
  try {
    const playerRef = ref(db, `rooms/${roomId}/${playerId}`);
    await update(playerRef, data);
    console.log(`🌱 Player updated in ${roomId}:`, playerId);
  } catch (err) {
    console.error("❌ Failed to update player data:", err);
  }
}

/* -------------------------------------------------
   REALTIME LISTENERS
--------------------------------------------------*/

// ✅ Subscribe to room updates (with safety checks)
export function subscribeRoom(roomId, callback) {
  const roomRef = ref(db, `rooms/${roomId}`);

  onValue(
    roomRef,
    (snapshot) => {
      try {
        const data = snapshot.exists() ? snapshot.val() : null;

        // Ignore invalid empty data to prevent script.js callback errors
        if (!data || typeof data !== "object") return;

        // Always wrap callback safely
        if (typeof callback === "function") callback(data);
      } catch (err) {
        console.error("❌ subscribeRoom callback error:", err);
      }
    },
    (error) => {
      console.error("❌ Firebase onValue listener error:", error);
    }
  );
}

/* -------------------------------------------------
   GAME START LOGIC
--------------------------------------------------*/

// ✅ Host marks game as started (syncs for both clients)
export async function markGameStarted(roomId) {
  try {
    const roomRef = ref(db, `rooms/${roomId}`);
    const startedAt = Date.now() + 2000; // 2s buffer sync

    await update(roomRef, {
      gameStarted: true,
      startedAt
    });

    console.log("🚀 Game started at:", startedAt);
  } catch (err) {
    console.error("❌ Failed to mark game started:", err);
  }
}

/* -------------------------------------------------
   UTILITIES
--------------------------------------------------*/

// ✅ Check if room exists before joining
export async function checkRoomExists(roomId) {
  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `rooms/${roomId}`));
    return snapshot.exists();
  } catch (err) {
    console.error("❌ Error checking room existence:", err);
    return false;
  }
}

/* -------------------------------------------------
   EXPORT DB
--------------------------------------------------*/
export { db };

