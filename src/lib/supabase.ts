import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseInstance && env.isSupabaseConfigured()) {
    try {
      supabaseInstance = createClient(env.supabaseUrl, env.supabasePublishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (e) {
      console.error("Failed to initialize Supabase client:", e);
    }
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();
