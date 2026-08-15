# IQ ARENA — Question Factory Operator Runbook

This runbook outlines standard operating procedures for operating, generating, moderating, and maintaining the industrial Question Factory in IQ ARENA.

---

## 1. CLI Commands Reference

All factory commands are idempotent, logged, and support `--dry-run` and bounded batch limits.

| Command | Purpose | Example |
| :--- | :--- | :--- |
| `bun run factory:ingest` | Ingest factual triples from Wikidata whitelist | `bun run factory:ingest --limit=500` |
| `bun run factory:generate` | Generate candidates from eligible facts | `bun run factory:generate --limit=200` |
| `bun run factory:validate` | Run validation pipeline and quality scoring | `bun run factory:validate` |
| `bun run factory:publish` | Publish verified variants into live pool | `bun run factory:publish` |
| `bun run factory:run` | End-to-end ingest, generate, validate, and publish | `bun run factory:run --target=1000` |
| `bun run factory:run --dry-run` | Test complete pipeline without committing state | `bun run factory:run --dry-run` |

---

## 2. Standard Production Pipeline Run

To execute an end-to-end generation run of 1,000 verified questions:

```bash
# 1. Test run in dry-run mode
bun run factory:run -- --dry-run

# 2. Execute live generation and publishing
bun run factory:run --target=1000

# 3. Verify audit export
ls -lh factory-audit-sample.json
```

---

## 3. Moderation & Batch Rollback

### Quarantining an Individual Question
1. Navigate to `/admin/questions` in the browser.
2. Select the question variant.
3. Click **Quarantine** or press key **`Q`**.
4. The question is immediately pulled from active matchmaking and training pools.

### Rolling Back a Generation Batch
If an ingestion job produced corrupted data:
```typescript
import { questionFactoryRunner } from "@/factory/factoryRunner";

// Quarantine all questions created by a specific batch ID
questionFactoryRunner.rollbackJob("factory-job-abc12345");
```

---

## 4. Admin Center Keyboard Controls

Inside `/admin/questions`:
- **`A`**: Approve / Restore question to Verified Live pool
- **`Q`**: Quarantine question from active game loops
- **`E`**: Open Edit Modal to fix typos or adjust difficulty
- **`↓` / `J`**: Select next question
- **`↑` / `K`**: Select previous question

---

## 5. Adding New Wikidata Relations / Templates

1. **Register Template in `src/factory/templates.ts`**:
   ```typescript
   {
     templateId: "geo-lake-depth",
     predicate: "deepest_lake",
     direction: "subject_to_object",
     languageCode: "fr",
     templatePrompt: "Quel est le lac le plus profond de {subject} ?",
     templateExplanation: "Le lac {object} est le plus profond situé en {subject}.",
     category: "Geography",
     subcategory: "Lakes",
     difficultyEstimate: "medium",
   }
   ```
2. **Add Verified Entities to Whitelist Corpus in `src/factory/wikidataCorpus.ts`**:
   Include standard `makeFact(...)` entries with source entity ID (`Q...`) and property ID (`P...`).
3. **Execute Pipeline and Run Tests**:
   ```bash
   bun run factory:run -- --dry-run
   bun test
   ```
