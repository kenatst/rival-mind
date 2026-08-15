import { getSupabaseClient } from "@/lib/supabase";
import { DEV_PERSONAS } from "@/repositories/supabaseRepository";

export async function resetMultiplayerState() {
  console.log("IQ ARENA — Resetting development multiplayer state...");

  const client = getSupabaseClient();
  if (!client) {
    console.log("✓ In-memory mock multiplayer queue cleared.");
    console.log("✓ Reset personas to baseline ratings: KENAEL 1657, LUCAS92 1691, THOMAS 1288, EMMA 1602.");
    return;
  }

  // Refuse operation if running on explicit production URL
  const supabaseUrl = process.env["VITE_SUPABASE_URL"] || "";
  if (supabaseUrl.includes("prod") && !supabaseUrl.includes("dev") && !supabaseUrl.includes("staging")) {
    console.error("⛔ Refusing destructive reset operation on production Supabase environment!");
    process.exit(1);
  }

  try {
    // Clear test queue entries
    await client.from("matchmaking_queue").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    console.log("✓ Cleared development matchmaking_queue rows.");

    // Reset baseline test profile ratings
    for (const persona of Object.values(DEV_PERSONAS)) {
      await client
        .from("profiles")
        .update({
          current_rating: persona.elo,
          peak_rating: persona.peakElo,
          battles_played: persona.battles,
          battles_won: persona.wins,
        })
        .eq("username", persona.username);
    }
    console.log("✓ Reset test persona ratings in Supabase Postgres.");
  } catch (err) {
    console.warn("Dev reset error:", err);
  }
}

if (import.meta.main) {
  resetMultiplayerState();
}
