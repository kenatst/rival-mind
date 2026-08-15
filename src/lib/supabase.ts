import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const url =
    (typeof process !== "undefined" && (process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"])) ||
    env.supabaseUrl ||
    "https://kvfxguzshicmhbvlzobg.supabase.co";

  const key =
    (typeof process !== "undefined" &&
      (process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
        process.env["VITE_SUPABASE_ANON_KEY"] ||
        process.env["VITE_SUPABASE_PUBLISHABLE_KEY"])) ||
    env.supabasePublishableKey;

  if (url && key) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      return supabaseInstance;
    } catch (e) {
      console.error("Failed to initialize Supabase client:", e);
    }
  }

  return null;
}

export const supabase = getSupabaseClient();
