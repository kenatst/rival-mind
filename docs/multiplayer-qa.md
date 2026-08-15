# IQ ARENA — Two-Browser Manual Multiplayer QA Test Guide

## 1. Prerequisites & Test Setup

- **Browser A**: Google Chrome (Standard Window)
- **Browser B**: Google Chrome (Incognito / Private Window) or Safari / Firefox
- **Local Dev URL**: `http://localhost:5174`

---

## 2. Step-by-Step Two-Player Execution Flow

### Step 1: Initialize Player Personas
1. In **Browser A**, open `http://localhost:5174/dev/multiplayer`.
   - Verify active persona is **KENAEL** (1,657 ELO · Diamond III).
2. In **Browser B** (Incognito), open `http://localhost:5174/dev/multiplayer`.
   - Click on **LUCAS92** (1,691 ELO · Diamond II) to switch Browser B's persona.

### Step 2: Queue for Matchmaking
1. In **Browser A**, click **"Launch Ranked Matchmaking"** (navigates to `/matchmaking`).
   - Browser A displays: `Searching... (±50 ELO)`.
2. In **Browser B**, click **"Launch Ranked Matchmaking"** (navigates to `/matchmaking`).
   - Both browsers simultaneously trigger the **VS Reveal**:
     - Browser A shows: `KENAEL vs LUCAS92`.
     - Browser B shows: `LUCAS92 vs KENAEL`.
   - Both browsers animate the synchronized **3.. 2.. 1..** countdown.

### Step 3: Play Round 1 (Lock State & Reveal Test)
1. Both browsers land on `/match` displaying the **exact same Question 1**.
2. In **Browser A**, click **Option A**.
   - Browser A shows: `✓ Answer Locked In · Waiting for simultaneous reveal...`.
   - Browser B instantly shows the live badge: `⚡ Opponent Locked In`.
   - **Critical Verification**: Browser B does NOT see which option Browser A picked.
3. In **Browser B**, click **Option B**.
4. Both browsers simultaneously transition into the **2.5s Reveal Phase**:
   - Both see the correct option highlighted in green.
   - Live score counter increments authoritatively.

### Step 4: Mid-Match Refresh Resilience Test (Round 3)
1. Advance to **Round 3**.
2. In **Browser A**, press **F5 / Cmd+R (Page Refresh)**.
   - Browser A immediately re-authenticates and re-hydrates the active match snapshot.
   - The question timer resumes smoothly from the remaining server seconds (no reset).
   - Answer locking and score sync continue flawlessly.

### Step 5: Match Completion & Rating Persistence (Round 8)
1. Complete through **Round 8**.
2. The server executes the atomic Elo transaction ($K=24$).
3. Both browsers simultaneously transition to `/match-result`:
   - Browser A displays: `VICTORY` (+18 ELO -> 1,675 ELO).
   - Browser B displays: `DEFEAT` (-14 ELO -> 1,677 ELO).
4. Refresh both browsers on `/home` and `/profile`:
   - **Verification**: New Elo ratings and battle histories are permanently persisted.

---

## 3. Edge Case QA Matrix

| Test Scenario | Action | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| **Queue Cancellation** | Tap `X` in matchmaking | Queue row marked cancelled; user returned to lobby | PASS |
| **Simultaneous Answers** | Both players click within 50ms | Server uses microsecond latency to break ties | PASS |
| **Timeout (No Answer)** | Let 10s timer expire | Server auto-submits timeout and triggers reveal | PASS |
| **Duplicate Completion** | Re-request finished match | Returns cached result payload with zero double-Elo mutation | PASS |
| **Rematch Request** | Click "Rematch" | Creates linked reciprocal match and transitions both players | PASS |
