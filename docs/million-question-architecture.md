# 🏛️ IQ ARENA — The 1,000,000 Unique Question Engine Architecture

## 1. The Absolute Uniqueness Invariant
In IQ ARENA, question counts reflect **distinct factual propositions** rather than superficial presentation variations:

$$\text{Canonical Hash} = \text{SHA-256}(\text{Domain} : \text{Category} : \text{Subject} : \text{Predicate} : \text{Object})$$

* **What Counts as 1 Unique Concept**:
  - `France` $\to$ `capital` $\to$ `Paris`.
* **What Does NOT Count as Multiple Questions**:
  - French / English / Japanese translations of the same fact.
  - Reverse question phrasing ("Paris is the capital of which country?").
  - Alternative distractors or answer order.

---

## 2. Quota Distribution across the 12 Sacred Domains

| Domain / Category | Canonical Target | Share (%) | Sample Topic Depth |
| :--- | :---: | :---: | :--- |
| **History** | 110,000 | 11.0% | Ancient Rome $\to$ Punic Wars $\to$ Battle of Cannae |
| **Geography** | 110,000 | 11.0% | Europe $\to$ Mountain Ranges $\to$ Alpine Peaks |
| **Science** | 110,000 | 11.0% | Chemistry $\to$ Periodic Table $\to$ Transition Metals |
| **Cinema** | 90,000 | 9.0% | Directors $\to$ French Cinema $\to$ Nouvelle Vague |
| **Sports** | 90,000 | 9.0% | Football $\to$ World Cup History $\to$ Golden Boot Winners |
| **Literature** | 80,000 | 8.0% | 19th Century $\to$ Russian Novels $\to$ Dostoevsky |
| **Music** | 80,000 | 8.0% | Classical $\to$ Romantic Era $\to$ Symphonies |
| **Nature** | 70,000 | 7.0% | Zoology $\to$ Mammalia $\to$ Cetaceans |
| **Art** | 65,000 | 6.5% | Painting $\to$ Impressionism $\to$ Claude Monet |
| **Technology** | 65,000 | 6.5% | Computing $\to$ Programming Languages $\to$ Compilers |
| **Food & Culture** | 55,000 | 5.5% | Gastronomy $\to$ European Cheeses $\to$ Appellations |
| **Gaming & Pop** | 45,000 | 4.5% | Video Games $\to$ 90s RPGs $\to$ Studio Developers |
| **World & Society** | 30,000 | 3.0% | World Heritage Sites $\to$ Historical Monuments |
| **TOTAL** | **1,000,000** | **100.0%** | **Over 240+ Specialized Clusters** |

---

## 3. The 4 Trust Pools
Not every specialized question enters Ranked competition. Questions are partitioned into trust tiers:
1. **`TRAINING` ($\sim 1,000,000$)**: Deepest domain knowledge for specialist study.
2. **`VERIFIED` ($\sim 800,000$)**: Fully validated with zero ambiguity and strong distractor sets.
3. **`COMPETITIVE` ($\sim 500,000$)**: High-confidence questions suitable for official Elo battles.
4. **`CHAMPIONSHIP` ($\sim 100,000$)**: Highly recognizable, pristine-quality questions for Tournaments.

---

## 4. Query Routing & Sub-10ms Selection Architecture
To prevent slow full-table scans or `ORDER BY random()` on a 1M-row table:
* **Selection Buckets**: Every concept receives a pre-assigned deterministic bucket `selection_bucket` in $[0, 4095]$.
* **Indexed Range Scanning**: The question selector chooses a random start bucket and scans indexed rows directly, guaranteeing sub-10ms query delivery with minimal database CPU overhead.
