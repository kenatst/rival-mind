# 🏛️ IQ ARENA — Hardcore Training Engine & Knowledge Mastery System

## 1. Overview
The **IQ ARENA Training Engine** transforms competitive trivia into a domain-mastery platform—the "Duolingo for General Knowledge." It allows enthusiasts, trivia competitors, and specialists to drill into topics with precision.

---

## 2. Mastery States & Progression
Player mastery on each concept follows a 5-stage deterministic progression tracked in `player_question_state`:
* **`UNSEEN`**: Never encountered.
* **`LEARNING`**: Answered 1 time; initial concept exposure.
* **`FAMILIAR`**: Answered correctly 2+ times across separate sessions.
* **`STRONG`**: High accuracy ($\ge 85\%$) with fast response times.
* **`MASTERED`**: Verified recall via Free Answer mode or repeated flawless responses over spaced intervals.

---

## 3. Spaced Repetition (SRS) Adaptive Review
The scheduling formula calculates review intervals based on stability and player accuracy:
* **Immediate Review**: Mistakes enter the `due_review` queue within 24 hours.
* **Expanding Intervals**: Successes increase the review interval exponentially ($I_{n+1} = I_n \times 2.2$).
* **Session Blending**: A typical adaptive training session combines:
  - 30% Due Spaced Reviews
  - 30% Weakness Targeting
  - 30% New / Unseen Concepts
  - 10% Hard / Expert Challenge Questions

---

## 4. Hardcore Training Formats
* **Quick Train**: 10 questions for rapid warmups.
* **Standard Session**: 25 questions balancing breadth and recall.
* **Deep Dive**: 50 questions focused on a specific cluster (e.g. French Cinema).
* **100-Question Marathon**: Cognitive endurance test tracking marathon accuracy.
* **Free Answer Recall**: Open text input without options.
* **Custom Training Builder**: Configurable format, question volume (10–100), difficulties, and timing modes (Timed vs. Zen Study).
