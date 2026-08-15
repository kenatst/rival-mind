# 🏛️ IQ ARENA — Training Engine & Knowledge Graph

## 1. Deep Topic Architecture
The knowledge graph provides **2,400+ hierarchical topics** structured across 4 depth levels:
* `Domain` (Culture, Knowledge, Life, Pop, World)
* `Category` (Cinema, History, Science, Sports, etc.)
* `Subcategory` (Directors, Ancient Civilizations, Physics, etc.)
* `Specialized Cluster` (Akira Kurosawa Filmography, Punic Wars Battles, Quantum Mechanics Milestones, etc.)

---

## 2. Topic Search & Instant Training
Players can search any topic or entity in `/train` and immediately launch tailored sessions:
* **Quick 10** : Rapid warmups.
* **Standard 25** : Balanced review.
* **Deep 50** : Comprehensive topic exploration.
* **100-Question Marathon** : True cognitive endurance drill.
* **Free Answer Recall** : Pure active recall without choices.
* **Spaced Review (SRS)** : Prioritized due reviews from `player_question_state`.

---

## 3. Sub-10ms Server Routing
To ensure gameplay is never slowed by table scale:
* **Selection Buckets (`selection_bucket` in $[0, 4095]$)** eliminate expensive `ORDER BY random()` operations.
* **Sparse Player State** : `player_question_state` rows are generated lazily upon player answers, preventing database bloat.
