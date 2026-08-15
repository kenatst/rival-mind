/**
 * Typed environment configuration.
 * Supports modern VITE_SUPABASE_PUBLISHABLE_KEY with fallback to VITE_SUPABASE_ANON_KEY.
 */

export const env = {
  // Public browser-safe variables
  supabaseUrl:
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env["VITE_SUPABASE_URL"]) || "",
  supabasePublishableKey:
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_ANON_KEY"])) ||
    "",
  backendMode:
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env["VITE_BACKEND_MODE"]) || "mock",
  isDev: (typeof import.meta !== "undefined" && import.meta.env?.DEV) || false,
  isProd: (typeof import.meta !== "undefined" && import.meta.env?.PROD) || false,

  // Helper to check if real Supabase credentials are configured
  isSupabaseConfigured(): boolean {
    return Boolean(
      this.supabaseUrl &&
        this.supabasePublishableKey &&
        this.supabaseUrl !== "https://your-project.supabase.co" &&
        this.supabaseUrl.startsWith("https://"),
    );
  },
};
