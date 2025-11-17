# 🌸 BloomCraft - Multiplayer Plant Growing Game

A beautiful real-time multiplayer game where you race against your friend to grow a flower from seed to full bloom! Collect elements like sun, water, soil, and food to help your plant grow faster.

![BloomCraft Banner](https://img.shields.io/badge/Game-Multiplayer-brightgreen) ![Firebase](https://img.shields.io/badge/Firebase-Realtime-orange) ![Status](https://img.shields.io/badge/Status-Active-success)

---

## 🎮 What is BloomCraft?

BloomCraft is a fun, competitive game where two players compete to grow their plants the fastest. Each player collects four elements (sun ☀️, water 💧, soil 🌱, and food 🍃) to advance their plant through 6 growth stages. The first player to reach full bloom wins!

### ✨ Game Features

- 🌺 **3 Different Flowers** - Choose between Lotus, Rose, or Sunflower
- 🎨 **Beautiful Dark Theme** - Relaxing fantasy garden atmosphere
- ⚡ **Real-Time Multiplayer** - See your opponent's progress live
- 🎊 **Celebration Effects** - Confetti animation when you win
- 🔄 **Play Again** - Instant rematch in the same room
- 💻 **Desktop Game** - Best experience on desktop browsers

---

## 🚀 How to Play

### Starting a Game

1. **Enter Your Name** - Type your name in the input field
2. **Create or Join Room**:
   - Click **"Create Room"** to start a new game
   - Share the room link with your friend
   - Or enter a room code to **"Join Room"**
3. **Wait for Both Players** - Host clicks "Start Game" when ready
4. **Race to Bloom!** - Collect all 4 elements to grow your plant

### Gameplay

- Click the **element buttons** (Sun, Water, Soil, Food) at the top
- Collect all 4 elements to advance to the next stage
- Your plant grows through **6 stages** total
- First player to reach Stage 6 wins! 🏆

### After the Game

- Winner screen appears with confetti 🎊
- Both players click **"Play Again"** for a rematch
- Stay in the same room - no need to rejoin!

---

## 🛠️ Tech Stack

This project uses:

- **HTML/CSS/JavaScript** - Frontend
- **Firebase Realtime Database** - Multiplayer sync
- **GSAP** - Smooth animations
- **Firebase Hosting** - Deployment

---

## 🎯 How It Works (Behind the Scenes)

### Room System

- Each game creates a unique **room ID** (e.g., `room_abc123`)
- Both players join the same room
- All game data syncs through Firebase Realtime Database

### Player Data Structure

```javascript
{
  playerId: "p_xyz789",
  playerName: "John",
  selectedPlant: "lotus",
  currentStage: 3,
  collectedElements: ["sun", "water"],
  completedAt: 1234567890,
  readyForRestart: false
}
```

### Game Flow

1. **Setup** → Players enter names and join room
2. **Sync** → Firebase listens for changes in real-time
3. **Gameplay** → Element collection tracked for both players
4. **Winner Detection** → First to Stage 6 wins
5. **Restart** → Both players must click "Play Again"

---

## 📝 Game Rules Summary

1. Two players per room
2. Choose your flower (Lotus, Rose, or Sunflower)
3. Click elements to collect them
4. Collect all 4 elements to grow one stage
5. Repeat until Stage 6 (full bloom)
6. First to complete Stage 6 wins!
7. Winner sees confetti celebration 🎊
8. Both players can rematch instantly

---

## 🎮 Play Now!

**Live Demo:** https://bloomcraft-79908.web.app/

Share with your friends and start growing! 🌸

---

**Made with 💚**

*Happy Growing!* 🌺