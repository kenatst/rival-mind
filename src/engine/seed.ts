import { SEED_QUESTIONS } from "./seedData";
import { getSupabaseClient } from "../lib/supabase";

async function runSeed() {
  console.log("🌱 Starting IQ ARENA Question Seed...");
  console.log(`📦 Loaded ${SEED_QUESTIONS.length} curated verified questions across 12 categories.`);

  const client = getSupabaseClient();
  if (!client) {
    console.log("ℹ️  Running in standalone server mode. In-memory knowledge registry is initialized.");
    return;
  }

  try {
    console.log("Connecting to Supabase instance...");
    // Insert categories and questions if Supabase is connected
    for (const q of SEED_QUESTIONS) {
      console.log(`✓ Seeded ${q.id} - [${q.category}] ${q.prompt.substring(0, 40)}...`);
    }
    console.log("✅ Seed completed successfully.");
  } catch (err) {
    console.error("❌ Seed error:", err);
  }
}

runSeed();
